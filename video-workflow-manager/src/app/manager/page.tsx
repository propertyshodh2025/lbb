'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { KanbanBoard } from '@/components/KanbanBoard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Users } from 'lucide-react'
import { Task, TaskStatus, User } from '@prisma/client'
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
  assignedTo?: {
    id: string
    name: string
    role: string
  }
}

export default function ManagerDashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [editors, setEditors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'MANAGER') {
      logout()
      return
    }
    fetchTasks()
    fetchEditors()

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

  const columns = [
    {
      id: 'unassigned',
      title: 'Unassigned Tasks',
      status: [TaskStatus.UNASSIGNED, TaskStatus.RAW_FILES_RECEIVED],
      color: 'bg-gray-50'
    },
    {
      id: 'editor-1',
      title: 'Editor 1',
      status: [TaskStatus.ASSIGNED],
      color: 'bg-blue-50',
      editorFilter: 'editor1'
    },
    {
      id: 'editor-2', 
      title: 'Editor 2',
      status: [TaskStatus.ASSIGNED],
      color: 'bg-green-50',
      editorFilter: 'editor2'
    },
    {
      id: 'editor-3',
      title: 'Editor 3', 
      status: [TaskStatus.ASSIGNED],
      color: 'bg-purple-50',
      editorFilter: 'editor3'
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
      color: 'bg-green-100'
    }
  ]

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

  const fetchEditors = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users?role=EDITOR', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEditors(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch editors:', error)
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const token = localStorage.getItem('token')
      
      // If moving to an editor column, we need to assign the task
      let assignedToId = null
      const targetColumn = columns.find(col => col.status.includes(newStatus))
      
      if (targetColumn?.editorFilter) {
        // Find the editor based on the column
        const editorIndex = parseInt(targetColumn.editorFilter.replace('editor', '')) - 1
        if (editors[editorIndex]) {
          assignedToId = editors[editorIndex].id
          newStatus = TaskStatus.ASSIGNED
        }
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          assignedToId: assignedToId
        })
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

  const getTasksForColumn = (column: any) => {
    if (column.editorFilter && column.status.includes(TaskStatus.ASSIGNED)) {
      // Filter tasks assigned to specific editor
      const editorIndex = parseInt(column.editorFilter.replace('editor', '')) - 1
      const editorId = editors[editorIndex]?.id
      return tasks.filter(task => 
        task.status === TaskStatus.ASSIGNED && 
        task.assignedToId === editorId
      )
    }
    
    if (column.id === 'unassigned') {
      return tasks.filter(task => 
        (task.status === TaskStatus.UNASSIGNED || task.status === TaskStatus.RAW_FILES_RECEIVED) &&
        !task.assignedToId
      )
    }
    
    return tasks.filter(task => column.status.includes(task.status) && !column.editorFilter)
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
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600">Assign tasks to editors and track progress</p>
            </div>
            <div className="flex gap-4 items-center">
              <Notifications /> {/* Add Notifications component */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {editors.length} Editors Available
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === TaskStatus.UNASSIGNED || 
                      (t.status === TaskStatus.RAW_FILES_RECEIVED && !t.assignedToId)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.status === TaskStatus.DONE).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Card key={column.id} className={`flex-1 min-w-[300px] ${column.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {column.title}
                  </CardTitle>
                  <div className="bg-white px-2 py-1 rounded-full text-xs font-medium">
                    {getTasksForColumn(column).length}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 min-h-[400px]">
                  {getTasksForColumn(column).map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-move"
                    >
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{task.project?.title}</p>
                      {task.assignedTo && (
                        <p className="text-xs text-blue-600 mt-1">
                          Assigned to: {task.assignedTo.name}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getTasksForColumn(column).length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}