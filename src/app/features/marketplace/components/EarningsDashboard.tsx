'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  Clock,
  Wallet,
  ArrowUpRight,
  Download,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreatorBalance, CreatorEarning, PayoutRequest } from '@/lib/types'

interface EarningsDashboardProps {
  balance: CreatorBalance | null
  earnings: CreatorEarning[]
  payouts: PayoutRequest[]
  loading: boolean
  onRequestPayout: (amount: number, method: string, details?: Record<string, unknown>) => Promise<boolean>
  onCancelPayout: (id: string) => Promise<boolean>
  onRefresh: () => Promise<void>
}

export function EarningsDashboard({
  balance,
  earnings,
  payouts,
  loading,
  onRequestPayout,
  onCancelPayout,
  onRefresh,
}: EarningsDashboardProps) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('paypal')
  const [payoutEmail, setPayoutEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      default: return ''
    }
  }

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) return

    setSubmitting(true)
    try {
      const details = payoutMethod === 'paypal' ? { email: payoutEmail } : {}
      const success = await onRequestPayout(parseFloat(payoutAmount), payoutMethod, details)
      if (success) {
        setShowPayoutDialog(false)
        setPayoutAmount('')
        setPayoutEmail('')
        await onRefresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelPayout = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this payout request?')) return
    await onCancelPayout(id)
    await onRefresh()
  }

  const minPayout = 10 // Minimum payout threshold

  return (
    <div className="space-y-6" data-testid="earnings-dashboard">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.availableBalance) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.pendingEarnings) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.totalEarned) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Total Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? formatCurrency(balance.totalPaidOut) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully withdrawn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Request Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Request Payout
            </span>
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={!balance || balance.availableBalance < minPayout}
                  data-testid="request-payout-btn"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                  <DialogDescription>
                    Enter the amount you'd like to withdraw. Minimum payout is {formatCurrency(minPayout)}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={minPayout}
                      max={balance?.availableBalance || 0}
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`${minPayout}.00`}
                      data-testid="payout-amount-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {balance ? formatCurrency(balance.availableBalance) : '$0.00'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                      <SelectTrigger data-testid="payout-method-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="stripe_connect">Stripe Connect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {payoutMethod === 'paypal' && (
                    <div className="space-y-2">
                      <Label htmlFor="email">PayPal Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={payoutEmail}
                        onChange={(e) => setPayoutEmail(e.target.value)}
                        placeholder="your@email.com"
                        data-testid="paypal-email-input"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestPayout}
                    disabled={
                      submitting ||
                      !payoutAmount ||
                      parseFloat(payoutAmount) < minPayout ||
                      parseFloat(payoutAmount) > (balance?.availableBalance || 0) ||
                      (payoutMethod === 'paypal' && !payoutEmail)
                    }
                    data-testid="confirm-payout-btn"
                  >
                    {submitting ? 'Processing...' : 'Request Payout'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            {balance && balance.availableBalance >= minPayout
              ? `You have ${formatCurrency(balance.availableBalance)} available for payout.`
              : `Minimum payout is ${formatCurrency(minPayout)}. Keep creating to earn more!`
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payout requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`payout-${payout.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{formatCurrency(payout.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(payout.createdAt)} via {payout.payoutMethod.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(payout.status)}>
                      {payout.status}
                    </Badge>
                    {payout.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelPayout(payout.id)}
                        data-testid={`cancel-payout-${payout.id}`}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No earnings yet</p>
              <p className="text-sm">Publish assets to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.slice(0, 10).map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`earning-${earning.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        +{formatCurrency(earning.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(earning.createdAt)}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(earning.status)}>
                    {earning.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
