"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { TrendingDown, Calculator, IndianRupee } from "lucide-react"

interface YearData {
  year: number
  previousBalance: number
  interestAdded: number
  openingBalance: number
  yearlyCost: number
  closingBalance: number
  isPartialYear?: boolean
  remainingMonths?: number
}

// Format number in Indian numbering system
function formatIndianNumber(num: number): string {
  const absNum = Math.abs(num)
  const sign = num < 0 ? "-" : ""
  
  if (absNum >= 10000000) {
    return sign + (absNum / 10000000).toFixed(2) + " Cr"
  } else if (absNum >= 100000) {
    return sign + (absNum / 100000).toFixed(2) + " L"
  } else if (absNum >= 1000) {
    const numStr = Math.round(absNum).toString()
    const lastThree = numStr.slice(-3)
    const rest = numStr.slice(0, -3)
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (rest ? "," : "") + lastThree
    return sign + formatted
  }
  return sign + Math.round(absNum).toString()
}

// Format for Y-axis (shorter format)
function formatYAxis(value: number): string {
  if (value >= 10000000) {
    return (value / 10000000).toFixed(1) + " Cr"
  } else if (value >= 100000) {
    return (value / 100000).toFixed(0) + " L"
  }
  return formatIndianNumber(value)
}

export function RunwayCalculator() {
  const [initialFundLakhs, setInitialFundLakhs] = useState(100) // 1 Crore
  const [monthlyExpense, setMonthlyExpense] = useState(40000) // 4.8L yearly
  const [interestRate, setInterestRate] = useState(7)
  const [inflationRate, setInflationRate] = useState(5)

  const { runwayYears, runwayMonths, yearlyData } = useMemo(() => {
    const data: YearData[] = []
    let previousBalance = 0 // Previous year's balance (after cost deduction)
    let yearlyCost = monthlyExpense * 12 // Year 1 cost
    let year = 0
    let finalMonths = 0

    // Year 1 opening is the initial fund
    let openingBalance = initialFundLakhs * 100000

    while (openingBalance > 0 && year < 100) {
      year++
      
      // For year 1: Opening = Initial Fund, no interest added
      // For year 2+: Opening = Previous Balance × (1 + interest rate)
      const interestAdded = year === 1 ? 0 : previousBalance * (interestRate / 100)
      if (year > 1) {
        openingBalance = previousBalance + interestAdded
      }
      
      // Calculate next year's cost (after inflation)
      const nextYearlyCost = yearlyCost * (1 + inflationRate / 100)
      const currentMonthlyCost = yearlyCost / 12
      
      // Deduct yearly cost from opening balance to get closing balance
      const closingBalance = openingBalance - yearlyCost
      
      data.push({
        year,
        previousBalance: year === 1 ? 0 : previousBalance,
        interestAdded,
        openingBalance,
        yearlyCost,
        closingBalance,
      })
      
      // If balance goes zero or negative, stop
      if (closingBalance <= 0) {
        // Calculate remaining months if balance went negative
        if (closingBalance < 0) {
          // How many months could we actually afford?
          const actualMonths = Math.floor(openingBalance / currentMonthlyCost)
          finalMonths = actualMonths
          // Update last entry to show partial year
          data[data.length - 1].isPartialYear = true
          data[data.length - 1].remainingMonths = actualMonths
        }
        break
      }
      
      // Check if closing balance can cover next year's expense
      // If not, calculate remaining months and stop
      const nextYearOpening = closingBalance * (1 + interestRate / 100)
      if (nextYearOpening < nextYearlyCost) {
        // Can't afford full next year - calculate remaining months
        const nextMonthlyCost = nextYearlyCost / 12
        const remainingMonths = Math.floor(nextYearOpening / nextMonthlyCost)
        
        if (remainingMonths > 0) {
          // Add partial year entry
          year++
          const partialInterest = closingBalance * (interestRate / 100)
          const partialOpening = closingBalance + partialInterest
          const partialCost = nextMonthlyCost * remainingMonths
          
          data.push({
            year,
            previousBalance: closingBalance,
            interestAdded: partialInterest,
            openingBalance: partialOpening,
            yearlyCost: partialCost,
            closingBalance: partialOpening - partialCost,
            isPartialYear: true,
            remainingMonths,
          })
        }
        finalMonths = remainingMonths
        break
      }
      
      // Store this year's closing balance for next iteration
      previousBalance = closingBalance
      
      // Inflate yearly cost for next year
      yearlyCost = nextYearlyCost
    }

    return {
      runwayYears: year - (finalMonths > 0 && finalMonths < 12 ? 1 : 0),
      runwayMonths: finalMonths,
      yearlyData: data,
    }
  }, [initialFundLakhs, monthlyExpense, interestRate, inflationRate])

  const chartData = yearlyData.map((d) => ({
    year: d.year,
    balance: Math.max(0, d.closingBalance),
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 xl:w-96 bg-sidebar border-r border-sidebar-border p-6 lg:min-h-screen">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">Indian Financial Runway</h1>
              <p className="text-sm text-muted-foreground">Plan your financial future</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Initial Fund */}
            <div className="space-y-2">
              <Label htmlFor="initial-fund" className="text-sidebar-foreground font-medium">
                Initial Fund (Lakhs)
              </Label>
              <Input
                id="initial-fund"
                type="number"
                value={initialFundLakhs}
                onChange={(e) => setInitialFundLakhs(Math.max(0, Number(e.target.value)))}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                = ₹{formatIndianNumber(initialFundLakhs * 100000)}
              </p>
            </div>

            {/* Monthly Expense */}
            <div className="space-y-2">
              <Label htmlFor="monthly-expense" className="text-sidebar-foreground font-medium">
                Monthly Expense (₹)
              </Label>
              <Input
                id="monthly-expense"
                type="number"
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Year 1 Cost: ₹{formatIndianNumber(monthlyExpense * 12)}
              </p>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sidebar-foreground font-medium">
                  Annual Interest Rate
                </Label>
                <span className="text-sm font-semibold text-primary">{interestRate}%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={([value]) => setInterestRate(value)}
                min={0}
                max={20}
                step={0.5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Inflation Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sidebar-foreground font-medium">
                  Annual Inflation Rate
                </Label>
                <span className="text-sm font-semibold text-destructive">{inflationRate}%</span>
              </div>
              <Slider
                value={[inflationRate]}
                onValueChange={([value]) => setInflationRate(value)}
                min={0}
                max={15}
                step={0.5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Hero Stat */}
          <Card className="mb-8 bg-gradient-to-br from-card to-secondary border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingDown className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm uppercase tracking-wide font-medium">
                    Your money will last for
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl lg:text-6xl font-bold text-primary">
                      {runwayYears}
                    </span>
                    <span className="text-2xl lg:text-3xl font-medium text-foreground">
                      {runwayYears === 1 ? "Year" : "Years"}
                    </span>
                    {runwayMonths > 0 && (
                      <>
                        <span className="text-3xl lg:text-4xl font-bold text-primary">
                          {runwayMonths}
                        </span>
                        <span className="text-xl lg:text-2xl font-medium text-foreground">
                          {runwayMonths === 1 ? "Month" : "Months"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                Fund Balance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" />
                    <XAxis
                      dataKey="year"
                      stroke="oklch(0.65 0 0)"
                      tick={{ fill: "oklch(0.65 0 0)" }}
                      axisLine={{ stroke: "oklch(0.25 0.01 250)" }}
                      label={{ value: "Year", position: "bottom", fill: "oklch(0.65 0 0)" }}
                    />
                    <YAxis
                      stroke="oklch(0.65 0 0)"
                      tick={{ fill: "oklch(0.65 0 0)" }}
                      axisLine={{ stroke: "oklch(0.25 0.01 250)" }}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.15 0.01 250)",
                        border: "1px solid oklch(0.25 0.01 250)",
                        borderRadius: "8px",
                        color: "oklch(0.96 0 0)",
                      }}
                      formatter={(value: number) => [`₹${formatIndianNumber(value)}`, "Balance"]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <ReferenceLine y={0} stroke="oklch(0.55 0.22 25)" strokeDasharray="5 5" />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="oklch(0.72 0.18 160)"
                      strokeWidth={3}
                      dot={{ fill: "oklch(0.72 0.18 160)", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: "oklch(0.72 0.18 160)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Year-by-Year Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground font-semibold">Year</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Prev. Balance</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Interest ({interestRate}%)</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Opening Balance</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Cost (+{inflationRate}% YoY)</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyData.map((row) => (
                      <TableRow key={row.year} className={`border-border hover:bg-secondary/50 ${row.isPartialYear ? "bg-primary/5" : ""}`}>
                        <TableCell className="font-medium text-foreground">
                          {row.isPartialYear ? `${row.year} (${row.remainingMonths}m)` : row.year}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {row.year === 1 ? "-" : formatIndianNumber(row.previousBalance)}
                        </TableCell>
                        <TableCell className="text-right text-primary tabular-nums">
                          {row.year === 1 ? "-" : `+${formatIndianNumber(row.interestAdded)}`}
                        </TableCell>
                        <TableCell className="text-right text-foreground tabular-nums">
                          {formatIndianNumber(row.openingBalance)}
                        </TableCell>
                        <TableCell className="text-right text-destructive tabular-nums">
                          -{formatIndianNumber(row.yearlyCost)}
                          {row.isPartialYear && <span className="text-xs ml-1">({row.remainingMonths}m)</span>}
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${row.closingBalance < 0 ? "text-destructive" : "text-foreground"}`}>
                          {formatIndianNumber(row.closingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
