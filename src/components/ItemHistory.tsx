import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { Item, StatusChange } from '../types/item';
import { formatTimeAgo } from '../utils/timeFormat';

interface ItemHistoryProps {
  item: Item;
  statusHistory?: StatusChange[];
}

interface HistoryEvent {
  type: 'created' | 'status_changed' | 'updated';
  timestamp: Timestamp;
  details: string;
}

export const ItemHistory: React.FC<ItemHistoryProps> = ({ item, statusHistory = [] }) => {
  // Build history events
  const events: HistoryEvent[] = [];

  // Add creation event
  events.push({
    type: 'created',
    timestamp: item.createdAt,
    details: 'Item created',
  });

  // Add status change events
  const itemStatusHistory = statusHistory.length > 0 ? statusHistory : (item.statusHistory || []);
  itemStatusHistory.forEach((change) => {
    events.push({
      type: 'status_changed',
      timestamp: change.timestamp,
      details: `Status changed to ${change.status}`,
    });
  });

  // Add update event if exists
  if (item.updatedAt) {
    events.push({
      type: 'updated',
      timestamp: item.updatedAt,
      details: 'Item updated',
    });
  }

  // Sort events in reverse chronological order (newest first)
  events.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'status_changed':
        return (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'updated':
        return (
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Item History</h3>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {event.details}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
