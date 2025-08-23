import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';

interface StudentActionsMenuProps {
  studentId?: string;
  studentStatus: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  onSuspend?: () => void;
}

const StudentActionsMenu: React.FC<StudentActionsMenuProps> = ({
  studentStatus,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onSuspend,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-md hover:bg-gray-100"
        aria-label="Student Actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed right-auto mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {onView && (
              <button
                onClick={() => {
                  onView();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Eye className="mr-3 h-4 w-4" />
                View Details
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={() => {
                  onEdit();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Edit className="mr-3 h-4 w-4" />
                Edit Student
              </button>
            )}
            
            {studentStatus === 'inactive' && onActivate && (
              <button
                onClick={() => {
                  onActivate();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                role="menuitem"
              >
                <UserCheck className="mr-3 h-4 w-4 text-green-500" />
                Activate Student
              </button>
            )}
            
            {studentStatus === 'active' && onSuspend && (
              <button
                onClick={() => {
                  onSuspend();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-gray-100"
                role="menuitem"
              >
                <UserX className="mr-3 h-4 w-4 text-yellow-500" />
                Suspend Student
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Trash2 className="mr-3 h-4 w-4 text-red-500" />
                Delete Student
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentActionsMenu;
