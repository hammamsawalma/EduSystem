import React, { useState, useEffect, useCallback } from "react";
import {
  Building,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "../../../utils/currency";
import { accountingService } from "../../../services/accountingService";
import type { GeneralExpensesResponse } from "../../../types/accounting";
import ExpenseModal from "./modals/ExpenseModal";

interface DateRange {
  start: string;
  end: string;
}

interface ExpensesTabProps {
  dateRange: DateRange;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ dateRange }) => {
  const [data, setData] = useState<GeneralExpensesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [filter, setFilter] = useState("approved");

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingService.getGeneralExpenses({
        startDate: dateRange.start,
        endDate: dateRange.end,
        status: filter,
      });

      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end, filter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      rent: <Building className="h-5 w-5" />,
      utilities: <Building className="h-5 w-5" />,
      supplies: <FileText className="h-5 w-5" />,
      marketing: <FileText className="h-5 w-5" />,
      maintenance: <Building className="h-5 w-5" />,
      insurance: <FileText className="h-5 w-5" />,
      default: <DollarSign className="h-5 w-5" />,
    };
    return icons[category] || icons.default;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExpenseSubmit = async (expenseData: any) => {
    try {
      // Here you would make the API call to create the expense
      console.log("Creating expense:", expenseData);

      // Refresh the data after successful expense creation
      await fetchExpenses();

      // Show success message
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to add expense");
    }
  };

  const closeModals = () => {
    setShowAddExpense(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {["approved", "pending", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 text-sm rounded-md capitalize ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddExpense(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.totals.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {data.totals.count}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Avg. Expense
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.totals.count > 0
                    ? formatCurrency(
                        data.totals.totalAmount / data.totals.count
                      )
                    : formatCurrency(0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expenses by Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.byCategory.map((category) => (
              <div key={category._id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category._id)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {category._id}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(category.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.count} transactions
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Expenses
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(expense.category)}
                        <span className="text-sm text-gray-900 capitalize">
                          {expense.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof expense.submittedBy === "string"
                        ? "Unknown User"
                        : `${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => console.log("View expense", expense._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {expense.status === "pending" && (
                        <button
                          onClick={() =>
                            console.log("Approve expense", expense._id)
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Modal */}
      </div>
      <ExpenseModal
        isOpen={showAddExpense}
        onClose={closeModals}
        onExpenseSubmit={handleExpenseSubmit}
      />
    </>
  );
};

export default ExpensesTab;
