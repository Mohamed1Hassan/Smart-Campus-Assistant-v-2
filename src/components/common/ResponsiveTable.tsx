"use client";
import React, { ReactNode } from "react";
import { useResponsive } from "../../utils/responsive";
import { TableSkeleton } from "./LoadingSkeleton";

interface Column<T = unknown> {
  key: string;
  Tag: string;
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  mobileTag?: string; // Alternative Tag for mobile cards
}

interface ResponsiveTableProps<T = unknown> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  rowKey?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedRows: string[]) => void;
}

export default function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  className = "",
  onSort,
  sortColumn,
  sortDirection = "asc",
  rowKey = "id",
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useResponsive();
  const isSmallScreen = isMobile || isTablet;

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;

    const newDirection =
      sortColumn === column.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(column.key, newDirection);
  };

  const handleRowSelection = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedRows, rowId]);
    } else {
      onSelectionChange(selectedRows.filter((id) => id !== rowId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange(data.map((row) => String(row[rowKey])));
    } else {
      onSelectionChange([]);
    }
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isPartiallySelected =
    selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return <TableSkeleton className={className} />;
  }

  if (data.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-mutedDark">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Mobile/Tablet Card View
  if (isSmallScreen) {
    return (
      <div className={`space-y-4 ${className}`}>
        {data.map((row, index) => (
          <div
            key={String(row[rowKey]) || index}
            className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${
              onRowClick
                ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                : ""
            }`}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => {
              if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onRowClick(row);
              }
            }}
            tabIndex={onRowClick ? 0 : undefined}
            role={onRowClick ? "button" : undefined}
          >
            <div className="space-y-3">
              {selectable && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(String(row[rowKey]))}
                      onChange={(e) =>
                        handleRowSelection(
                          String(row[rowKey]),
                          e.target.checked,
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-mutedDark">
                      Select
                    </span>
                  </label>
                </div>
              )}

              {columns.map((column) => {
                const value = row[column.key];
                const displayValue = column.render
                  ? column.render(value, row)
                  : value;
                const Tag = column.mobileTag || column.Tag;

                return (
                  <div
                    key={column.key}
                    className="flex justify-between items-start"
                  >
                    <span className="text-sm font-medium text-gray-500 dark:text-mutedDark min-w-0 flex-shrink-0 mr-4">
                      {Tag}:
                    </span>
                    <div
                      className={`text-sm text-gray-900 dark:text-textDark min-w-0 flex-1 text-right ${column.className || ""}`}
                    >
                      {displayValue as React.ReactNode}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div
      className={`bg-white dark:bg-cardDark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isPartiallySelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    />
                  </label>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-mutedDark uppercase tracking-wider ${
                    column.sortable
                      ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      : ""
                  } ${column.className || ""}`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.Tag}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <svg
                          className={`w-3 h-3 ${
                            sortColumn === column.key && sortDirection === "asc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                        <svg
                          className={`w-3 h-3 -mt-1 ${
                            sortColumn === column.key &&
                            sortDirection === "desc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-cardDark divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr
                key={String(row[rowKey]) || index}
                className={`${
                  onRowClick
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    : ""
                } ${selectedRows.includes(String(row[rowKey])) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(String(row[rowKey]))}
                      onChange={(e) =>
                        handleRowSelection(
                          String(row[rowKey]),
                          e.target.checked,
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const value = row[column.key];
                  const displayValue = column.render
                    ? column.render(value, row)
                    : value;

                  return (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-textDark ${column.className || ""}`}
                    >
                      {displayValue as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
