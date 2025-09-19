'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KanbanBoard } from '@/components/KanbanBoard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, LogOut } from 'lucide-react'
import { Task, TaskStatus, Project } from '@prisma/client'

interface TaskWithProject extends Task {
  project: {
    title: string
    client: {
      name: string
    }
  }
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    dueDate: '',
    notes: '',
    priority: 'Medium'
  })

  const columns = [
    {
      id: 'raw-files',
      title: 'Raw Files Received',
      status: [TaskStatus.RAW_FILES_RECEIVED],
      color: 'bg-blue-50'
    },
    {
      id: 'unassigned',
      title: 'Unassigned Tasks',
      status: [TaskStatus.UNASSIGNED],
      color: 'bg-gray-50'
    },
    {
      id: 'assigned',
      title: 'Assigned',
      status: [TaskStatus.ASSIGNED],
      color: 'bg-yellow-50'
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
    },
    {
      id: 'delivered',
      title: 'Delivered',
      status: [TaskStatus.DELIVERED],
      color: 'bg-purple-50'
    }
  ]

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      logout()
      return
    }
    fetchTasks()
    fetchProjects()
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

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
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
        await fetchTasks() // Refresh tasks
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setNewTask({
          title: '',
          description: '',
          projectId: '',
          dueDate: '',
          notes: '',
          priority: 'Medium'
        })
        setShowCreateForm(false)
        await fetchTasks()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Add a new video editing task</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Project</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={newTask.projectId}
                      onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <Input
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Task</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <KanbanBoard
          tasks={tasks}
          columns={columns}
          onTaskMove={handleTaskMove}
          showProject={true}
        />
      </div>
    </div>
  )
}