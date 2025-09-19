'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TimelineTracker } from '@/components/TimelineTracker'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Package, Clock, CheckCircle } from 'lucide-react'
import { Task, TaskStatus, TaskStatusHistory } from '@prisma/client'

interface TaskWithDetails extends Task {
  project: {
    title: string
    client: {
      name: string
    }
  }
  statusHistory: TaskStatusHistory[]
}

export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'CLIENT') {
      logout()
      return
    }
    fetchTasks()
  }, [user])

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const activeProjects = tasks.filter(t => t.status !== TaskStatus.DELIVERED)
  const completedProjects = tasks.filter(t => t.status === TaskStatus.DELIVERED)
  const inProgressProjects = tasks.filter(t => 
    t.status === TaskStatus.IN_PROGRESS || 
    t.status === TaskStatus.ASSIGNED
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600">Track your video editing projects</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{inProgressProjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedProjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects Section */}
        {activeProjects.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
              <div className="text-sm text-gray-600">
                {activeProjects.length} project{activeProjects.length !== 1 ? 's' : ''} in progress
              </div>
            </div>
            <TimelineTracker tasks={activeProjects} />
          </div>
        )}

        {/* Completed Projects Section */}
        {completedProjects.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Completed Projects</h2>
              <div className="text-sm text-gray-600">
                {completedProjects.length} project{completedProjects.length !== 1 ? 's' : ''} delivered
              </div>
            </div>
            <div className="space-y-4">
              {completedProjects.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.project.title}</p>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Delivered
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Completed on {new Date(task.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your video editing projects will appear here once they're created by your admin.
            </p>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-10 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Understanding Your Project Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Package className="w-4 h-4 text-blue-600 mr-2" />
                  <span><strong>Raw Files Received:</strong> Your files have been received and catalogued</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-orange-600 mr-2" />
                  <span><strong>Editing in Progress:</strong> Our editors are working on your project</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span><strong>Editing Complete:</strong> Editing is finished, final review in progress</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  <span><strong>Delivered:</strong> Your completed project has been delivered</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}