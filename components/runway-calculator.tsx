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

// Format number in Indian numbering system with full precision
function formatIndianNumber(num: number): string {
  const absNum = Math.abs(num)
  const sign = num < 0 ? "-" : ""
  
  // Format with Indian comma system (XX,XX,XXX.XX)
  const formatWithIndianCommas = (n: number): string => {
    const [intPart, decPart] = n.toFixed(2).split(".")
    const lastThree = intPart.slice(-3)
    const rest = intPart.slice(0, -3)
    const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (rest ? "," : "") + lastThree
    return formatted + "." + decPart
  }
  
  return sign + formatWithIndianCommas(absNum)
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
    let fullYears = 0

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
      
      // If balance goes zero or negative, this year is NOT complete
      // Calculate how many months we could actually afford
      if (closingBalance <= 0) {
        // Remaining Months = Opening Balance / Monthly Cost
        const actualMonths = Math.floor(openingBalance / currentMonthlyCost)
        finalMonths = actualMonths
        // Update last entry to show partial year
        data[data.length - 1].isPartialYear = true
        data[data.length - 1].remainingMonths = actualMonths
        // Full years is the previous year (since this year is incomplete)
        fullYears = year - 1
        break
      }
      
      // This year completed successfully
      fullYears = year
      
      // Store this year's closing balance for next iteration
      previousBalance = closingBalance
      
      // Inflate yearly cost for next year
      yearlyCost = yearlyCost * (1 + inflationRate / 100)
    }

    return {
      runwayYears: fullYears,
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
        {/* Sidebar - Collapsible on mobile */}
        <aside className="w-full lg:w-80 xl:w-96 bg-sidebar border-b lg:border-b-0 lg:border-r border-sidebar-border p-4 sm:p-6 lg:min-h-screen">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-sidebar-foreground">Indian Financial Runway</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Plan your financial future</p>
            </div>
          </div>

          {/* Mobile: 2-column grid, Desktop: single column */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
            {/* Initial Fund */}
            <div className="space-y-2">
              <Label htmlFor="initial-fund" className="text-sidebar-foreground font-medium text-sm">
                Initial Fund (Lakhs)
              </Label>
              <Input
                id="initial-fund"
                type="number"
                value={initialFundLakhs}
                onChange={(e) => setInitialFundLakhs(Math.max(0, Number(e.target.value)))}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground h-9 sm:h-10"
                min={0}
              />
              <p className="text-xs text-muted-foreground truncate">
                = ₹{formatIndianNumber(initialFundLakhs * 100000)}
              </p>
            </div>

            {/* Monthly Expense */}
            <div className="space-y-2">
              <Label htmlFor="monthly-expense" className="text-sidebar-foreground font-medium text-sm">
                Monthly Expense (₹)
              </Label>
              <Input
                id="monthly-expense"
                type="number"
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground h-9 sm:h-10"
                min={0}
              />
              <p className="text-xs text-muted-foreground truncate">
                Year 1: ₹{formatIndianNumber(monthlyExpense * 12)}
              </p>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sidebar-foreground font-medium text-sm">
                  Interest Rate
                </Label>
                <span className="text-xs sm:text-sm font-semibold text-primary">{interestRate}%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={([value]) => setInterestRate(value)}
                min={0}
                max={20}
                step={0.5}
                className="py-1 sm:py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Inflation Rate */}
            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sidebar-foreground font-medium text-sm">
                  Inflation Rate
                </Label>
                <span className="text-xs sm:text-sm font-semibold text-destructive">{inflationRate}%</span>
              </div>
              <Slider
                value={[inflationRate]}
                onValueChange={([value]) => setInflationRate(value)}
                min={0}
                max={15}
                step={0.5}
                className="py-1 sm:py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Hero Stat */}
          <Card className="mb-4 sm:mb-6 lg:mb-8 bg-gradient-to-br from-card to-secondary border-border">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-primary/10 shrink-0">
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wide font-medium">
                    Your money will last for
                  </p>
                  <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                    <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary">
                      {runwayYears}
                    </span>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-medium text-foreground">
                      {runwayYears === 1 ? "Year" : "Years"}
                    </span>
                    {runwayMonths > 0 && (
                      <>
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                          {runwayMonths}
                        </span>
                        <span className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground">
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
          <Card className="mb-4 sm:mb-6 lg:mb-8 bg-card border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-card-foreground flex items-center gap-2 text-base sm:text-lg">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Fund Balance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              <div className="h-56 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" />
                    <XAxis
                      dataKey="year"
                      stroke="oklch(0.65 0 0)"
                      tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                      axisLine={{ stroke: "oklch(0.25 0.01 250)" }}
                      label={{ value: "Year", position: "bottom", fill: "oklch(0.65 0 0)", fontSize: 11, dy: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="oklch(0.65 0 0)"
                      tick={{ fill: "oklch(0.65 0 0)", fontSize: 10 }}
                      axisLine={{ stroke: "oklch(0.25 0.01 250)" }}
                      tickFormatter={formatYAxis}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.15 0.01 250)",
                        border: "1px solid oklch(0.25 0.01 250)",
                        borderRadius: "8px",
                        color: "oklch(0.96 0 0)",
                        fontSize: "12px",
                        padding: "8px 12px",
                      }}
                      formatter={(value: number) => [`₹${formatIndianNumber(value)}`, "Balance"]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <ReferenceLine y={0} stroke="oklch(0.55 0.22 25)" strokeDasharray="5 5" />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="oklch(0.72 0.18 160)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: "oklch(0.72 0.18 160)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Table */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-card-foreground text-base sm:text-lg">Year-by-Year Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground font-semibold whitespace-nowrap px-2 sm:px-4">Year</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right whitespace-nowrap px-2 sm:px-4 hidden sm:table-cell">Prev. Balance</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right whitespace-nowrap px-2 sm:px-4 hidden md:table-cell">Interest ({interestRate}%)</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right whitespace-nowrap px-2 sm:px-4">Opening</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right whitespace-nowrap px-2 sm:px-4">Cost</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-right whitespace-nowrap px-2 sm:px-4">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyData.map((row) => (
                      <TableRow key={row.year} className={`border-border hover:bg-secondary/50 ${row.isPartialYear ? "bg-primary/5" : ""}`}>
                        <TableCell className="font-medium text-foreground px-2 sm:px-4">
                          {row.isPartialYear ? `${row.year} (${row.remainingMonths}m)` : row.year}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums px-2 sm:px-4 hidden sm:table-cell">
                          {row.year === 1 ? "-" : formatIndianNumber(row.previousBalance)}
                        </TableCell>
                        <TableCell className="text-right text-primary tabular-nums px-2 sm:px-4 hidden md:table-cell">
                          {row.year === 1 ? "-" : `+${formatIndianNumber(row.interestAdded)}`}
                        </TableCell>
                        <TableCell className="text-right text-foreground tabular-nums px-2 sm:px-4">
                          {formatIndianNumber(row.openingBalance)}
                        </TableCell>
                        <TableCell className="text-right text-destructive tabular-nums px-2 sm:px-4">
                          -{formatIndianNumber(row.yearlyCost)}
                          {row.isPartialYear && <span className="text-xs ml-1">({row.remainingMonths}m)</span>}
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums px-2 sm:px-4 ${row.closingBalance < 0 ? "text-destructive" : "text-foreground"}`}>
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
