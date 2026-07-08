import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

interface EmployeeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailsPage({ params }: EmployeeDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from('profiles')
    .select(`
      *,
      departments(name),
      user_roles(role)
    `)
    .eq('id', id)
    .single();

  if (error || !employee) {
    notFound();
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/employees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={employee.avatar_url} alt={employee.full_name} />
              <AvatarFallback className="text-lg">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{employee.full_name}</CardTitle>
            <CardDescription>{employee.job_title}</CardDescription>
            <Badge variant={getRoleBadgeVariant(employee.user_roles?.role || 'employee')}>
              {employee.user_roles?.role || 'Employee'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{employee.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                <p className="text-sm">{employee.employee_id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-sm">{employee.departments?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <p className="text-sm">{employee.job_title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Manager ID</label>
                <p className="text-sm">{employee.manager_id || 'N/A'}</p>
              </div>
              {employee.hire_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                    <p className="text-sm">{new Date(employee.hire_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {employee.date_of_birth && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-sm">{new Date(employee.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
              {employee.emergency_contact_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                  <p className="text-sm">{employee.emergency_contact_name}</p>
                  {employee.emergency_contact_phone && (
                    <p className="text-sm text-muted-foreground">{employee.emergency_contact_phone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(employee.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{new Date(employee.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}