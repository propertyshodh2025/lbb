'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, Package, Truck } from 'lucide-react'
import { Task, TaskStatus, TaskStatusHistory } from '@prisma/client'
import { format } from 'date-fns'

interface TimelineTask extends Task {
  project: {
    title: string
    client: {
      name: string
    }
  }
  statusHistory: TaskStatusHistory[]
}

interface TimelineTrackerProps {
  tasks: TimelineTask[]
}

export function TimelineTracker({ tasks }: TimelineTrackerProps) {
  const getStatusIcon = (status: TaskStatus, isActive: boolean = false) => {
    const baseClasses = "w-5 h-5"
    const activeClasses = isActive ? "text-blue-600" : "text-gray-400"
    
    switch (status) {
      case TaskStatus.RAW_FILES_RECEIVED:
        return <Package className={`${baseClasses} ${activeClasses}`} />
      case TaskStatus.IN_PROGRESS:
        return <Clock className={`${baseClasses} ${activeClasses}`} />
      case TaskStatus.DONE:
        return <CheckCircle className={`${baseClasses} ${activeClasses}`} />
      case TaskStatus.DELIVERED:
        return <Truck className={`${baseClasses} ${activeClasses}`} />
      default:
        return <AlertCircle className={`${baseClasses} ${activeClasses}`} />
    }
  }

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.RAW_FILES_RECEIVED:
        return 'Raw Files Received'
      case TaskStatus.UNASSIGNED:
        return 'Queued for Assignment'
      case TaskStatus.ASSIGNED:
        return 'Assigned to Editor'
      case TaskStatus.IN_PROGRESS:
        return 'Editing in Progress'
      case TaskStatus.DONE:
        return 'Editing Complete'
      case TaskStatus.DELIVERED:
        return 'Delivered'
      default:
        return status.replace('_', ' ')
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.RAW_FILES_RECEIVED:
        return 'bg-blue-100 text-blue-800'
      case TaskStatus.UNASSIGNED:
        return 'bg-gray-100 text-gray-800'
      case TaskStatus.ASSIGNED:
        return 'bg-yellow-100 text-yellow-800'
      case TaskStatus.IN_PROGRESS:
        return 'bg-orange-100 text-orange-800'
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-800'
      case TaskStatus.DELIVERED:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressSteps = (task: TimelineTask) => {
    const allSteps = [
      TaskStatus.RAW_FILES_RECEIVED,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
      TaskStatus.DELIVERED
    ]

    return allSteps.map((step) => {
      const historyItem = task.statusHistory.find(h => h.status === step)
      const isActive = task.status === step
      const isCompleted = allSteps.indexOf(task.status) > allSteps.indexOf(step)
      
      return {
        status: step,
        label: getStatusLabel(step),
        timestamp: historyItem?.timestamp,
        isActive,
        isCompleted
      }
    })
  }

  return (
    <div className="space-y-6">
      {tasks.map((task) => {
        const steps = getProgressSteps(task)
        
        return (
          <Card key={task.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <p className="text-gray-600 text-sm mt-1">{task.project.title}</p>
                </div>
                <Badge className={getStatusColor(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gray-200" />
                
                {/* Steps */}
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.status} className="relative flex items-start">
                      {/* Step Icon */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        step.isCompleted || step.isActive 
                          ? 'border-blue-600 bg-blue-600' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {step.isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          getStatusIcon(step.status, step.isActive)
                        )}
                      </div>
                      
                      {/* Step Content */}
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            step.isCompleted || step.isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </p>
                          {step.timestamp && (
                            <p className="text-xs text-gray-500">
                              {format(new Date(step.timestamp), 'MMM dd, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                        
                        {step.isActive && (
                          <p className="text-xs text-blue-600 mt-1">
                            Currently in progress
                          </p>
                        )}
                        
                        {step.isCompleted && !step.timestamp && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Task Details */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Priority</p>
                    <p className="font-medium">{task.priority}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {task.dueDate && (
                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className="font-medium">
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
                
                {task.description && (
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm">Description</p>
                    <p className="text-sm mt-1">{task.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {tasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600">
              Your video editing projects will appear here once they're created.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}