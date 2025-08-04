import React from 'react';
import { Plus, Clock, Calendar, DollarSign } from 'lucide-react';

const TimeTracking: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">Log your teaching hours and track your earnings</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Time Entry
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">6.5 hours</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-success-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">$240.00</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-warning-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Lesson Type</th>
                <th className="table-header-cell">Hours</th>
                <th className="table-header-cell">Rate</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <tr>
                <td className="table-cell">July 25, 2025</td>
                <td className="table-cell">Individual Math Tutoring</td>
                <td className="table-cell">1.5</td>
                <td className="table-cell">$30.00</td>
                <td className="table-cell">$45.00</td>
                <td className="table-cell">
                  <button className="btn btn-secondary btn-sm">Edit</button>
                </td>
              </tr>
              <tr>
                <td className="table-cell">July 25, 2025</td>
                <td className="table-cell">Group Science Classes</td>
                <td className="table-cell">3.0</td>
                <td className="table-cell">$25.00</td>
                <td className="table-cell">$75.00</td>
                <td className="table-cell">
                  <button className="btn btn-secondary btn-sm">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
