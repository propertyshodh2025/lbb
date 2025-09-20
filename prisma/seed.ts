import { PrismaClient, UserRole, TaskStatus } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: await hashPassword('admin123'),
      name: 'Admin User',
      role: UserRole.ADMIN
    }
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@demo.com',
      password: await hashPassword('manager123'),
      name: 'Manager User',
      role: UserRole.MANAGER
    }
  })

  const editor1 = await prisma.user.create({
    data: {
      email: 'editor1@demo.com',
      password: await hashPassword('editor123'),
      name: 'Editor One',
      role: UserRole.EDITOR
    }
  })

  const editor2 = await prisma.user.create({
    data: {
      email: 'editor2@demo.com',
      password: await hashPassword('editor123'),
      name: 'Editor Two',
      role: UserRole.EDITOR
    }
  })

  const editor3 = await prisma.user.create({
    data: {
      email: 'editor3@demo.com',
      password: await hashPassword('editor123'),
      name: 'Editor Three',
      role: UserRole.EDITOR
    }
  })

  const client1 = await prisma.user.create({
    data: {
      email: 'client@demo.com',
      password: await hashPassword('client123'),
      name: 'Client Company',
      role: UserRole.CLIENT
    }
  })

  const client2 = await prisma.user.create({
    data: {
      email: 'client2@demo.com',
      password: await hashPassword('client123'),
      name: 'Another Client',
      role: UserRole.CLIENT
    }
  })

  // New media client
  const mediaClient = await prisma.user.create({
    data: {
      email: 'mediaclient@demo.com',
      password: await hashPassword('mediaclient123'),
      name: 'Media Client Corp',
      role: UserRole.MEDIA_CLIENT
    }
  })

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Corporate Video Campaign',
      description: 'Marketing video for Q4 campaign',
      clientId: client1.id
    }
  })

  const project2 = await prisma.project.create({
    data: {
      title: 'Product Demo Video',
      description: 'Demo video for new product launch',
      clientId: client1.id
    }
  })

  const project3 = await prisma.project.create({
    data: {
      title: 'Training Video Series',
      description: 'Employee training video series',
      clientId: client2.id
    }
  })

  const project4 = await prisma.project.create({
    data: {
      title: 'Media Client Ad Spot',
      description: '30-second ad for social media',
      clientId: mediaClient.id
    }
  })

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Edit Corporate Video - Main Cut',
      description: 'Create main cut for corporate video campaign',
      projectId: project1.id,
      createdById: admin.id,
      status: TaskStatus.RAW_FILES_RECEIVED,
      priority: 'High',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Client wants energetic music and modern graphics'
    }
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Product Demo - Feature Highlights',
      description: 'Edit demo video focusing on key features',
      projectId: project2.id,
      createdById: admin.id,
      status: TaskStatus.ASSIGNED,
      assignedToId: editor1.id,
      priority: 'Medium',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      notes: 'Include screen recordings and voice-over'
    }
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Training Video - Module 1',
      description: 'First module of training series',
      projectId: project3.id,
      createdById: admin.id,
      status: TaskStatus.IN_PROGRESS,
      assignedToId: editor2.id,
      priority: 'Low',
      notes: 'Keep it under 10 minutes'
    }
  })

  const task4 = await prisma.task.create({
    data: {
      title: 'Corporate Video - Social Media Cut',
      description: '30-second version for social media',
      projectId: project1.id,
      createdById: admin.id,
      status: TaskStatus.DONE,
      assignedToId: editor1.id,
      priority: 'High',
      notes: 'Square aspect ratio for Instagram'
    }
  })

  const task5 = await prisma.task.create({
    data: {
      title: 'Media Ad - Final Polish',
      description: 'Final review and polish for the 30-second ad spot',
      projectId: project4.id,
      createdById: manager.id,
      status: TaskStatus.UNDER_REVIEW,
      assignedToId: editor3.id,
      priority: 'High',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      notes: 'Ensure brand guidelines are met.'
    }
  })

  // Create status history for tasks
  await prisma.taskStatusHistory.create({
    data: {
      taskId: task1.id,
      status: TaskStatus.RAW_FILES_RECEIVED,
      notes: 'Task created and raw files received',
      updatedBy: admin.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task2.id,
      status: TaskStatus.RAW_FILES_RECEIVED,
      notes: 'Task created',
      updatedBy: admin.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task2.id,
      status: TaskStatus.ASSIGNED,
      notes: 'Assigned to Editor One',
      updatedBy: manager.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task3.id,
      status: TaskStatus.RAW_FILES_RECEIVED,
      notes: 'Task created',
      updatedBy: admin.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task3.id,
      status: TaskStatus.ASSIGNED,
      notes: 'Assigned to Editor Two',
      updatedBy: manager.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task3.id,
      status: TaskStatus.IN_PROGRESS,
      notes: 'Started editing',
      updatedBy: editor2.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task4.id,
      status: TaskStatus.RAW_FILES_RECEIVED,
      notes: 'Task created',
      updatedBy: admin.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task4.id,
      status: TaskStatus.ASSIGNED,
      notes: 'Assigned to Editor One',
      updatedBy: manager.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task4.id,
      status: TaskStatus.IN_PROGRESS,
      notes: 'Started editing',
      updatedBy: editor1.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task4.id,
      status: TaskStatus.DONE,
      notes: 'Editing completed',
      updatedBy: editor1.id
    }
  })

  await prisma.taskStatusHistory.create({
    data: {
      taskId: task5.id,
      status: TaskStatus.RAW_FILES_RECEIVED,
      notes: 'Task created for media client',
      updatedBy: manager.id
    }
  })
  await prisma.taskStatusHistory.create({
    data: {
      taskId: task5.id,
      status: TaskStatus.ASSIGNED,
      notes: 'Assigned to Editor Three',
      updatedBy: manager.id
    }
  })
  await prisma.taskStatusHistory.create({
    data: {
      taskId: task5.id,
      status: TaskStatus.IN_PROGRESS,
      notes: 'Editor started work',
      updatedBy: editor3.id
    }
  })
  await prisma.taskStatusHistory.create({
    data: {
      taskId: task5.id,
      status: TaskStatus.UNDER_REVIEW,
      notes: 'Submitted for review',
      updatedBy: editor3.id
    }
  })

  console.log('Database seeded successfully!')
  console.log('Demo accounts:')
  console.log('Admin: admin@demo.com / admin123')
  console.log('Manager: manager@demo.com / manager123')
  console.log('Editors: editor1@demo.com, editor2@demo.com, editor3@demo.com / editor123')
  console.log('Clients: client@demo.com, client2@demo.com / client123')
  console.log('Media Client: mediaclient@demo.com / mediaclient123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })