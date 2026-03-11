"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Progress } from "../../ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  MapPin,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Target,
  CheckCircle,
} from "lucide-react";

// Types
interface AttendanceSession {
  id: string;
  courseId: number;
  courseName: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  fraudAlerts: number;
  status: "ACTIVE" | "SCHEDULED" | "ENDED" | "CANCELLED";
}

interface AttendanceStats {
  totalSessions: number;
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalFraudAlerts: number;
  averageAttendanceRate: number;
  averagePunctualityRate: number;
  averageFraudRate: number;
  peakAttendanceTime: string;
  mostActiveLocation: string;
  topPerformingCourse: string;
  worstPerformingCourse: string;
}

interface TrendData {
  date: string;
  attendanceRate: number;
  punctualityRate: number;
  fraudRate: number;
  totalSessions: number;
  totalStudents: number;
}

interface CoursePerformance {
  courseId: number;
  courseName: string;
  totalSessions: number;
  averageAttendance: number;
  averagePunctuality: number;
  fraudRate: number;
  trend: "UP" | "DOWN" | "STABLE";
}

interface LocationPerformance {
  locationId: string;
  locationName: string;
  totalSessions: number;
  averageAttendance: number;
  fraudRate: number;
  violations: number;
}

interface AttendanceAnalyticsProps {
  onExportData?: (type: string, filters: Record<string, unknown>) => void;
  onGenerateFileText?: (FileTextType: string, timeRange: string) => void;
}

export function AttendanceAnalytics({
  onExportData,
  onGenerateFileText,
}: AttendanceAnalyticsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<
    CoursePerformance[]
  >([]);
  const [locationPerformance, setLocationPerformance] = useState<
    LocationPerformance[]
  >([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [FileTextType, setFileTextType] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load data on component mount
  useEffect(() => {
    loadAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedCourse, selectedLocation]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalyticsData();
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedCourse, selectedLocation]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSessions(),
        loadStats(),
        loadTrendData(),
        loadCoursePerformance(),
        loadLocationPerformance(),
      ]);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      // Mock data - replace with actual API call
      const mockSessions: AttendanceSession[] = [
        {
          id: "session-1",
          courseId: 101,
          courseName: "Computer Science 101",
          title: "Data Structures Lecture",
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
          ),
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            radius: 50,
            name: "Main Campus - Room 101",
          },
          totalStudents: 45,
          presentStudents: 38,
          absentStudents: 5,
          lateStudents: 2,
          fraudAlerts: 3,
          status: "ENDED",
        },
        {
          id: "session-2",
          courseId: 102,
          courseName: "Mathematics 201",
          title: "Calculus Tutorial",
          startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          endTime: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000,
          ),
          location: {
            latitude: 40.713,
            longitude: -74.0058,
            radius: 30,
            name: "Main Campus - Room 205",
          },
          totalStudents: 30,
          presentStudents: 28,
          absentStudents: 2,
          lateStudents: 1,
          fraudAlerts: 1,
          status: "ENDED",
        },
        {
          id: "session-3",
          courseId: 101,
          courseName: "Computer Science 101",
          title: "Algorithm Design",
          startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            radius: 50,
            name: "Main Campus - Room 101",
          },
          totalStudents: 45,
          presentStudents: 42,
          absentStudents: 2,
          lateStudents: 1,
          fraudAlerts: 0,
          status: "ENDED",
        },
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Mock data - replace with actual API call
      const mockStats: AttendanceStats = {
        totalSessions: 45,
        totalStudents: 1200,
        totalPresent: 1080,
        totalAbsent: 90,
        totalLate: 30,
        totalFraudAlerts: 15,
        averageAttendanceRate: 90.0,
        averagePunctualityRate: 87.5,
        averageFraudRate: 1.25,
        peakAttendanceTime: "10:00 AM",
        mostActiveLocation: "Main Campus - Room 101",
        topPerformingCourse: "Computer Science 101",
        worstPerformingCourse: "Mathematics 201",
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadTrendData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockTrendData: TrendData[] = [
        {
          date: "2024-01-01",
          attendanceRate: 85,
          punctualityRate: 80,
          fraudRate: 2.1,
          totalSessions: 5,
          totalStudents: 120,
        },
        {
          date: "2024-01-02",
          attendanceRate: 88,
          punctualityRate: 82,
          fraudRate: 1.8,
          totalSessions: 6,
          totalStudents: 135,
        },
        {
          date: "2024-01-03",
          attendanceRate: 92,
          punctualityRate: 85,
          fraudRate: 1.5,
          totalSessions: 7,
          totalStudents: 150,
        },
        {
          date: "2024-01-04",
          attendanceRate: 90,
          punctualityRate: 87,
          fraudRate: 1.2,
          totalSessions: 8,
          totalStudents: 165,
        },
        {
          date: "2024-01-05",
          attendanceRate: 94,
          punctualityRate: 90,
          fraudRate: 1.0,
          totalSessions: 9,
          totalStudents: 180,
        },
        {
          date: "2024-01-06",
          attendanceRate: 91,
          punctualityRate: 88,
          fraudRate: 1.3,
          totalSessions: 7,
          totalStudents: 155,
        },
        {
          date: "2024-01-07",
          attendanceRate: 89,
          punctualityRate: 86,
          fraudRate: 1.1,
          totalSessions: 6,
          totalStudents: 140,
        },
      ];
      setTrendData(mockTrendData);
    } catch (error) {
      console.error("Failed to load trend data:", error);
    }
  };

  const loadCoursePerformance = async () => {
    try {
      // Mock data - replace with actual API call
      const mockCoursePerformance: CoursePerformance[] = [
        {
          courseId: 101,
          courseName: "Computer Science 101",
          totalSessions: 25,
          averageAttendance: 92.5,
          averagePunctuality: 89.0,
          fraudRate: 1.2,
          trend: "UP",
        },
        {
          courseId: 102,
          courseName: "Mathematics 201",
          totalSessions: 20,
          averageAttendance: 85.0,
          averagePunctuality: 82.5,
          fraudRate: 2.1,
          trend: "DOWN",
        },
        {
          courseId: 103,
          courseName: "Physics 301",
          totalSessions: 15,
          averageAttendance: 88.0,
          averagePunctuality: 85.5,
          fraudRate: 1.5,
          trend: "STABLE",
        },
      ];
      setCoursePerformance(mockCoursePerformance);
    } catch (error) {
      console.error("Failed to load course performance:", error);
    }
  };

  const loadLocationPerformance = async () => {
    try {
      // Mock data - replace with actual API call
      const mockLocationPerformance: LocationPerformance[] = [
        {
          locationId: "loc-1",
          locationName: "Main Campus - Room 101",
          totalSessions: 30,
          averageAttendance: 91.5,
          fraudRate: 1.0,
          violations: 5,
        },
        {
          locationId: "loc-2",
          locationName: "Main Campus - Room 205",
          totalSessions: 20,
          averageAttendance: 87.0,
          fraudRate: 2.2,
          violations: 8,
        },
        {
          locationId: "loc-3",
          locationName: "Library - Study Room A",
          totalSessions: 15,
          averageAttendance: 89.5,
          fraudRate: 1.8,
          violations: 3,
        },
      ];
      setLocationPerformance(mockLocationPerformance);
    } catch (error) {
      console.error("Failed to load location performance:", error);
    }
  };

  const handleExportData = (type: string) => {
    const filters = {
      timeRange,
      selectedCourse,
      selectedLocation,
      FileTextType,
    };
    onExportData?.(type, filters);
  };

  const handleGenerateFileText = () => {
    onGenerateFileText?.(FileTextType, timeRange);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "UP":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DOWN":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "STABLE":
        return <Target className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "UP":
        return "text-green-600";
      case "DOWN":
        return "text-red-600";
      case "STABLE":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    if (rate >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return "bg-green-500";
    if (rate >= 80) return "bg-yellow-500";
    if (rate >= 70) return "bg-orange-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Analytics</h2>
          <p className="text-muted-foreground">
            Advanced analytics and insights for attendance management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center space-x-4">
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="101">Computer Science 101</SelectItem>
            <SelectItem value="102">Mathematics 201</SelectItem>
            <SelectItem value="103">Physics 301</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="loc-1">Main Campus - Room 101</SelectItem>
            <SelectItem value="loc-2">Main Campus - Room 205</SelectItem>
            <SelectItem value="loc-3">Library - Study Room A</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={FileTextType}
          onChange={(e) => setFileTextType(e.target.value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="FileText Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
            <SelectItem value="trends">Trends</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleGenerateFileText}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Generate FileText
        </Button>
        <Button variant="outline" onClick={() => handleExportData("analytics")}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalStudents}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Students
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.averageAttendanceRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Attendance
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.averagePunctualityRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Punctuality
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.averageFraudRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Fraud Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Overview */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Performance Overview</span>
              </CardTitle>
              <CardDescription>
                Key performance indicators and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.averageAttendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={stats.averageAttendanceRate}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Punctuality Rate
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.averagePunctualityRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={stats.averagePunctualityRate}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fraud Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.averageFraudRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stats.averageFraudRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Insights</span>
              </CardTitle>
              <CardDescription>
                Key insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">
                      Peak Attendance Time
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.peakAttendanceTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">
                      Most Active Location
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.mostActiveLocation}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">
                      Top Performing Course
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.topPerformingCourse}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium">Needs Attention</div>
                    <div className="text-sm text-muted-foreground">
                      {stats.worstPerformingCourse}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Course Performance</span>
          </CardTitle>
          <CardDescription>Performance metrics by course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coursePerformance.map((course) => (
              <div key={course.courseId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{course.courseName}</div>
                    <div className="text-sm text-muted-foreground">
                      {course.totalSessions} sessions
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getPerformanceBadge(course.averageAttendance)}
                    >
                      {course.averageAttendance.toFixed(1)}%
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(course.trend)}
                      <span
                        className={`text-sm ${getTrendColor(course.trend)}`}
                      >
                        {course.trend}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Attendance</div>
                    <div
                      className={`font-medium ${getPerformanceColor(course.averageAttendance)}`}
                    >
                      {course.averageAttendance.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Punctuality</div>
                    <div
                      className={`font-medium ${getPerformanceColor(course.averagePunctuality)}`}
                    >
                      {course.averagePunctuality.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fraud Rate</div>
                    <div
                      className={`font-medium ${getPerformanceColor(100 - course.fraudRate)}`}
                    >
                      {course.fraudRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Performance</span>
          </CardTitle>
          <CardDescription>Performance metrics by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationPerformance.map((location) => (
              <div key={location.locationId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{location.locationName}</div>
                    <div className="text-sm text-muted-foreground">
                      {location.totalSessions} sessions
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getPerformanceBadge(
                        location.averageAttendance,
                      )}
                    >
                      {location.averageAttendance.toFixed(1)}%
                    </Badge>
                    <Badge variant="outline">
                      {location.violations} violations
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Attendance</div>
                    <div
                      className={`font-medium ${getPerformanceColor(location.averageAttendance)}`}
                    >
                      {location.averageAttendance.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fraud Rate</div>
                    <div
                      className={`font-medium ${getPerformanceColor(100 - location.fraudRate)}`}
                    >
                      {location.fraudRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Violations</div>
                    <div className="font-medium">{location.violations}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Trend Analysis</span>
          </CardTitle>
          <CardDescription>Attendance trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendData.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium">{day.date}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-muted-foreground">
                      Attendance
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="progress-bar bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={
                          {
                            "--progress-width": `${day.attendanceRate}%`,
                          } as React.CSSProperties
                        }
                        role="progressbar"
                        aria-valuenow={day.attendanceRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Attendance rate: ${day.attendanceRate}%`}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-right">
                      {day.attendanceRate}%
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-muted-foreground">
                      Punctuality
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="progress-bar bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={
                          {
                            "--progress-width": `${day.punctualityRate}%`,
                          } as React.CSSProperties
                        }
                        role="progressbar"
                        aria-valuenow={day.punctualityRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Punctuality rate: ${day.punctualityRate}%`}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-right">
                      {day.punctualityRate}%
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-muted-foreground">
                      Fraud
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="progress-bar bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={
                          {
                            "--progress-width": `${day.fraudRate}%`,
                          } as React.CSSProperties
                        }
                        role="progressbar"
                        aria-valuenow={day.fraudRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Fraud rate: ${day.fraudRate}%`}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-right">
                      {day.fraudRate}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.totalSessions} sessions, {day.totalStudents} students
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalSessions || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Sessions</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats?.totalPresent || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Present</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {stats?.totalFraudAlerts || 0}
          </div>
          <div className="text-sm text-muted-foreground">Fraud Alerts</div>
        </div>
      </div>
    </div>
  );
}
