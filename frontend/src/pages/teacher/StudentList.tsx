import React from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';

const StudentList: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">Manage your student information and progress</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="form-input pl-10"
              />
            </div>
          </div>
          <button className="btn btn-secondary flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="btn btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Grade</th>
                <th className="table-header-cell">Subject</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Balance</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <tr>
                <td className="table-cell">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">EJ</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Emma Johnson</p>
                      <p className="text-xs text-gray-500">emma.johnson@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">9th Grade</td>
                <td className="table-cell">Math, Science</td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Active
                  </span>
                </td>
                <td className="table-cell">$80.00</td>
                <td className="table-cell">
                  <button className="btn btn-secondary btn-sm">View</button>
                </td>
              </tr>
              <tr>
                <td className="table-cell">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">MS</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Michael Smith</p>
                      <p className="text-xs text-gray-500">michael.smith@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">10th Grade</td>
                <td className="table-cell">Physics, Chemistry</td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Active
                  </span>
                </td>
                <td className="table-cell">$0.00</td>
                <td className="table-cell">
                  <button className="btn btn-secondary btn-sm">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
