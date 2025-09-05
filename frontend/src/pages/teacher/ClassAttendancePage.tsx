import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ClassStudentsAttendance from '../../components/features/classes/ClassStudentsAttendance';

const ClassAttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/teacher/classes');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </button>
      </div>

      <ClassStudentsAttendance classId={id} />
    </div>
  );
};

export default ClassAttendancePage;
