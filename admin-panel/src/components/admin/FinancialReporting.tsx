'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, FinancialReport } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Download, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function FinancialReporting() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    report_type: 'revenue',
    period: 'monthly',
    start_date: '',
    end_date: '',
    format: 'pdf',
  });

  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReportHistory();
      if (response.success) {
        setReports(response.data.reports || []);
      }
    } catch (error: any) {
      toast.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportConfig.start_date || !reportConfig.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    try {
      setGenerating(true);
      const blob = await adminService.generateFinancialReport({
        report_type: reportConfig.report_type,
        period: reportConfig.period,
        start_date: reportConfig.start_date,
        end_date: reportConfig.end_date,
        format: reportConfig.format as any,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = reportConfig.format === 'pdf' ? 'pdf' : reportConfig.format === 'csv' ? 'csv' : 'xlsx';
      a.download = `${reportConfig.report_type}-report-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report generated successfully');
      loadReportHistory();
    } catch (error: any) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (report: FinancialReport) => {
    if (!report.export_url) {
      toast.error('Report file not available');
      return;
    }

    try {
      window.open(report.export_url, '_blank');
    } catch (error: any) {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Financial Reporting</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Generate and manage financial reports
        </p>
      </div>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={reportConfig.report_type}
                onValueChange={(value) =>
                  setReportConfig({ ...reportConfig, report_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="transaction_volume">Transaction Volume</SelectItem>
                  <SelectItem value="escrow_balance">Escrow Balance</SelectItem>
                  <SelectItem value="refund">Refund Report</SelectItem>
                  <SelectItem value="fee_collection">Fee Collection</SelectItem>
                  <SelectItem value="tax">Tax Report</SelectItem>
                  <SelectItem value="reconciliation">Reconciliation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={reportConfig.period}
                onValueChange={(value) =>
                  setReportConfig({ ...reportConfig, period: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={reportConfig.start_date}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, start_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={reportConfig.end_date}
                onChange={(e) =>
                  setReportConfig({ ...reportConfig, end_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={reportConfig.format}
                onValueChange={(value) =>
                  setReportConfig({ ...reportConfig, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="quickbooks">QuickBooks</SelectItem>
                  <SelectItem value="xero">Xero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerateReport}
                disabled={generating || !reportConfig.start_date || !reportConfig.end_date}
                className="w-full"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reports generated yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-semibold capitalize">
                      {report.report_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="capitalize">{report.period}</TableCell>
                    <TableCell>
                      {format(new Date(report.start_date), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(report.end_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.generated_at), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {report.generated_by?.full_name || 'System'}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.export_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


