import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Users, Briefcase, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Link from "next/link";
import { Button } from "../../ui/button";
import { formatDateUTC } from "@/lib/utils";

type HRDashboardTabProps = {
  stats: {
    totalUsers: number;
    totalInterviews: number;
    completedInterviews: number;
  };
  recentInterviews: {
    id: string;
    name: string;
    user: { name: string | null };
    updatedAt: Date;
  }[];
};

const HRDashboardTab = ({ stats, recentInterviews }: HRDashboardTabProps) => {
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      color: "bg-indigo-100",
    },
    {
      title: "Total Interviews",
      value: stats.totalInterviews,
      icon: <Briefcase className="w-6 h-6 text-sky-500" />,
      color: "bg-sky-100",
    },
    {
      title: "Completed Interviews",
      value: stats.completedInterviews,
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      color: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-white/70 border-black/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-dark/80">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.color}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-dark">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Interviews Table */}
      <Card className="bg-white/70 border-black/10">
        <CardHeader>
          <CardTitle>Recently Completed Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interview</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Completed On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInterviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">
                    {interview.name}
                  </TableCell>
                  <TableCell>{interview.user.name}</TableCell>
                  <TableCell>{formatDateUTC(interview.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/feedback/${interview.id}`}>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDashboardTab;
