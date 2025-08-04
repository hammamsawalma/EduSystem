import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';

interface TeacherActionsMenuProps {
  teacherId: number;
  teacherStatus: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onBlock?: () => void;
}

const TeacherActionsMenu: React.FC<TeacherActionsMenuProps> = ({
  teacherId,
  teacherStatus,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onBlock,
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
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Actions"
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
                Edit
              </button>
            )}
            
            {teacherStatus === 'Pending' && onApprove && (
              <button
                onClick={() => {
                  onApprove();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                role="menuitem"
              >
                <CheckCircle className="mr-3 h-4 w-4 text-green-500" />
                Approve
              </button>
            )}
            
            {teacherStatus === 'Active' && onBlock && (
              <button
                onClick={() => {
                  onBlock();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-gray-100"
                role="menuitem"
              >
                <XCircle className="mr-3 h-4 w-4 text-yellow-500" />
                Block
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
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherActionsMenu;
