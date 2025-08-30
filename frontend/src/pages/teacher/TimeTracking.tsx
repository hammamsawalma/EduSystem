import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Clock,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  fetchEarningsSummary,
  clearError,
} from "../../store/slices/financialSlice";
import { fetchClasses } from "../../store/slices/classesSlice";
import TimeEntryModal from "../../components/features/timeTracking/TimeEntryModal";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currency";
import type {
  CreateTimeEntryData,
  UpdateTimeEntryData,
  TimeEntry,
} from "../../types/financial";

interface TimeEntryModalData {
  _id?: string;
  date: string;
  hoursWorked: number;
  description?: string;
  classId?: string;
}

const TimeTracking: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timeEntries, earningsSummary, isLoading, error } =
    useAppSelector((state) => state.financial);
  const { classes } = useAppSelector((state) => state.classes);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryModalData | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    page: 1,
  });

  // Calculate current week and month stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    );
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekEntries = timeEntries.filter(
      (entry) => new Date(entry.date) >= weekStart
    );
    const thisMonthEntries = timeEntries.filter(
      (entry) => new Date(entry.date) >= monthStart
    );

    // Calculate unique classes taught this month
    const uniqueClasses = new Set(
      thisMonthEntries
        .filter(entry => entry.classId?._id)
        .map(entry => entry.classId!._id)
    ).size;

    // Calculate average hourly rate
    const ratesWithCurrency = timeEntries
      .filter(entry => entry.hourlyRate && entry.currency)
      .map(entry => ({ rate: entry.hourlyRate, currency: entry.currency }));
    
    const avgRate = ratesWithCurrency.length > 0 
      ? ratesWithCurrency.reduce((sum, item) => sum + item.rate, 0) / ratesWithCurrency.length
      : 0;
    
    const mostCommonCurrency = ratesWithCurrency.length > 0 
      ? ratesWithCurrency[0].currency 
      : 'DZD';

    return {
      weekHours: thisWeekEntries.reduce(
        (sum, entry) => sum + entry.hoursWorked,
        0
      ),
      monthEarnings: thisMonthEntries.reduce(
        (sum, entry) => sum + entry.totalAmount,
        0
      ),
      totalEntries: timeEntries.length,
      uniqueClassesThisMonth: uniqueClasses,
      averageHourlyRate: avgRate,
      currency: mostCommonCurrency,
    };
  }, [timeEntries]);

  useEffect(() => {
    dispatch(fetchTimeEntries(filters));
    dispatch(fetchClasses());
    dispatch(
      fetchEarningsSummary({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      })
    );
  }, [dispatch, filters]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    dispatch(fetchTimeEntries(newFilters));
  };

  const handleCreateEntry = async (data: CreateTimeEntryData) => {
    try {
      await dispatch(createTimeEntry(data)).unwrap();
      setIsModalOpen(false);
      dispatch(
        fetchEarningsSummary({
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          )
            .toISOString()
            .split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
        })
      );
    } catch (error) {
      console.error("Failed to create time entry:", error);
    }
  };

  const handleUpdateEntry = async (data: UpdateTimeEntryData) => {
    try {
      await dispatch(updateTimeEntry(data)).unwrap();
      setIsModalOpen(false);
      setEditingEntry(null);
      dispatch(
        fetchEarningsSummary({
          startDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          )
            .toISOString()
            .split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
        })
      );
    } catch (error) {
      console.error("Failed to update time entry:", error);
    }
  };

  const handleModalSubmit = async (
    data: CreateTimeEntryData | UpdateTimeEntryData
  ) => {
    if (editingEntry) {
      await handleUpdateEntry(data as UpdateTimeEntryData);
    } else {
      await handleCreateEntry(data as CreateTimeEntryData);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm("Are you sure you want to delete this time entry?")) {
      try {
        await dispatch(deleteTimeEntry(entryId)).unwrap();
        dispatch(
          fetchEarningsSummary({
            startDate: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            )
              .toISOString()
              .split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
          })
        );
      } catch (error) {
        console.error("Failed to delete time entry:", error);
      }
    }
  };

  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry({
      _id: entry._id,
      date: entry.date.split("T")[0],
      hoursWorked: entry.hoursWorked,
      description: entry.description || "",
      classId: entry.classId?._id || "",
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number, currency: string = "DZD") => {
    return formatCurrencyUtil(amount, currency);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canEdit = (entry: any) => {
    const createdAt = new Date(entry.createdAt);
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return createdAt > fourHoursAgo;
  };

  const getEditHistoryInfo = (entry: TimeEntry) => {
    if (!entry.editHistory || entry.editHistory.length === 0) {
      return null;
    }
    const lastEdit = entry.editHistory[entry.editHistory.length - 1];
    return `Last edited: ${formatDate(lastEdit.editedAt)}`;
  };

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => dispatch(clearError())}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-gray-600">
              Log your teaching hours and track your earnings
            </p>
            {timeEntries.length > 0 && timeEntries[0].teacherId && (
              <p className="text-sm text-gray-500 mt-1">
                Logged as: {timeEntries[0].teacherId.profile.firstName} {timeEntries[0].teacherId.profile.lastName}
                {timeEntries[0].teacherId.email && (
                  <span className="ml-2">({timeEntries[0].teacherId.email})</span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={() => {
                setEditingEntry(null);
                setIsModalOpen(true);
              }}
              className="btn btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Time Entry
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.weekHours.toFixed(1)} hours
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-success-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    earningsSummary?.summary?.totalEarnings ||
                      stats.monthEarnings,
                    stats.currency
                  )}
                </p>
                {stats.averageHourlyRate > 0 && (
                  <p className="text-xs text-gray-500">
                    Avg: {formatCurrency(stats.averageHourlyRate, stats.currency)}/hr
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-warning-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalEntries}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold text-sm">C</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Classes This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.uniqueClassesThisMonth}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Time Entries */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Time Entries
            </h3>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No time entries found</p>
              </div>
            ) : (
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Date</th>
                    <th className="table-header-cell">Class</th>
                    <th className="table-header-cell">Description</th>
                    <th className="table-header-cell">Hours</th>
                    <th className="table-header-cell">Rate</th>
                    <th className="table-header-cell">Total</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {timeEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium">{formatDate(entry?.date)}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <div className="font-medium">{entry.classId?.name || "N/A"}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          {entry.description ? (
                            <div className="text-sm text-gray-700 max-w-48 truncate" title={entry.description}>
                              {entry.description}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                          {entry.editHistory && entry.editHistory.length > 0 && (
                            <div className="text-xs text-orange-500 mt-1" title={getEditHistoryInfo(entry) || ''}>
                              Edited {entry.editHistory.length} time{entry.editHistory.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          {entry.hoursWorked}h
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(entry.hourlyRate, entry.currency)}/hr
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-right">
                          <div className="font-medium text-success-600">
                            {formatCurrency(entry.totalAmount, entry.currency)}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          {canEdit(entry) && (
                            <>
                              <button
                                onClick={() => openEditModal(entry)}
                                className="btn btn-secondary btn-sm flex items-center"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="btn btn-danger btn-sm flex items-center"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </button>
                            </>
                          )}
                          {!canEdit(entry) && (
                            <span className="text-xs text-gray-400 italic">
                              Edit expired
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {/* Time Entry Modal */}
        <TimeEntryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
          onSubmit={handleModalSubmit}
          editingEntry={editingEntry}
          classes={classes}
        />
    </>
  );
};

export default TimeTracking;
