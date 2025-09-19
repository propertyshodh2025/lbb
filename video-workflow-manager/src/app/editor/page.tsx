'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KanbanBoard } from '@/components/KanbanBoard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Task, TaskStatus } from '@prisma/client'
import { Notifications } from '@/components/Notifications' // Import Notifications
import { emitTaskUpdate } from '@/contexts/SocketContext' // Import emitTaskUpdate

interface TaskWithProject extends Task {
  project: {
    title: string
    client: {
      id: string // Add client ID for socket emission
      name: string
    }
  }
}

export default function EditorDashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [loading, setLoading] = useState(true)

  const columns = [
    {
      id: 'assigned',
      title: 'Assigned to Me',
      status: [TaskStatus.ASSIGNED],
      color: 'bg-blue-50'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      status: [TaskStatus.IN_PROGRESS],
      color: 'bg-orange-50'
    },
    {
      id: 'done',
      title: 'Done',
      status: [TaskStatus.DONE],
      color: 'bg-green-50'
    }
  ]

  useEffect(() => {
    if (user?.role !== 'EDITOR') {
      logout()
      return
    }
    fetchTasks()

    // Listen for real-time updates
    window.addEventListener('taskStatusChanged', fetchTasks as EventListener)
    window.addEventListener('taskAssigned', fetchTasks as EventListener)
    window.addEventListener('projectUpdated', fetchTasks as EventListener)

    return () => {
      window.removeEventListener('taskStatusChanged', fetchTasks as EventListener)
      window.removeEventListener('taskAssigned', fetchTasks as EventListener)
      window.removeEventListener('projectUpdated', fetchTasks as EventListener)
    }
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

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        // Emit socket event after successful DB update
        emitTaskUpdate({
          taskId: updatedTask.task.id,
          taskTitle: updatedTask.task.title,
          status: updatedTask.task.status,
          assignedToId: updatedTask.task.assignedToId,
          clientId: updatedTask.task.project.client.id,
        })
        await fetchTasks()
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const assignedTasks = tasks.filter(t => t.status === TaskStatus.ASSIGNED)
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS)
  const doneTasks = tasks.filter(t => t.status === TaskStatus.DONE)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editor Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex gap-4">
              <Notifications /> {/* Add Notifications component */}
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{assignedTasks.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{doneTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={() => {
                const firstAssigned = assignedTasks[0]
                if (firstAssigned) {
                  handleTaskMove(firstAssigned.id, TaskStatus.IN_PROGRESS)
                }
              }}
              disabled={assignedTasks.length === 0}
            >
              Start Next Task
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const firstInProgress = inProgressTasks[0]
                if (firstInProgress) {
                  handleTaskMove(firstInProgress.id, TaskStatus.DONE)
                }
              }}
              disabled={inProgressTasks.length === 0}
            >
              Mark Current as Done
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          tasks={tasks}
          columns={columns}
          onTaskMove={handleTaskMove}
          showProject={true}
        />

        {/* Recent Activity */}
        <Card className="mt-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium">Recent Activity</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600">{task.project.title}</p>
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          task.status === TaskStatus.DONE ? 'bg-green-500' :
                          task.status === TaskStatus.IN_PROGRESS ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`} />
                        <span className="text-xs text-gray-500">
                          {task.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                        task.priority === 'High' ? 'bg-red-100 text-red-800' :
                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(task.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No tasks assigned to you yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}