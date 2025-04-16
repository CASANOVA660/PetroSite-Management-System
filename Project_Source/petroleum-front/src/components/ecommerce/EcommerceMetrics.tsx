import React, { useEffect } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  CheckCircleIcon,
  TimeIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface EcommerceMetricsProps {
  data: {
    totalActions: number;
    completedActions: number;
    pendingActions: number;
    inProgressActions: number;
  };
}

const EcommerceMetrics: React.FC<EcommerceMetricsProps> = ({ data }) => {

  const metricsData = {
    totalActions: data?.totalActions || 0,
    completedActions: data?.completedActions || 0,
    pendingActions: data?.pendingActions || 0,
    inProgressActions: data?.inProgressActions || 0
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500">Total des actions</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">{metricsData.totalActions}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500">Actions terminées</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">{metricsData.completedActions}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500">Actions en attente</h3>
        <p className="mt-2 text-3xl font-bold text-yellow-600">{metricsData.pendingActions}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500">Actions en cours</h3>
        <p className="mt-2 text-3xl font-bold text-blue-600">{metricsData.inProgressActions}</p>
      </div>
    </div>
  );
};

export default EcommerceMetrics;
