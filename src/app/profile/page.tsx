'use client'

import { useState, useEffect } from 'react'
import { getProfile, updateProfile } from './actions'
import Navigation from '@/components/ui/Navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import type { User } from '@/lib/types'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    student_level: '',
    phone: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const result = await getProfile()
    if (result.data) {
      setUser(result.data)
      setFormData({
        username: result.data.username,
        student_level: result.data.student_level,
        phone: result.data.phone || ''
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value)
    })

    const result = await updateProfile(formDataObj)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.success || 'Profile updated!' })
      setIsEditing(false)
      loadProfile()
    }
    
    setIsLoading(false)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Navigation role={user.role} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />

                <Input
                  label="Email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />

                <Select
                  label="Student Level"
                  value={formData.student_level}
                  onChange={(e) => setFormData({ ...formData, student_level: e.target.value })}
                  options={[
                    { value: 'gcse', label: 'GCSE' },
                    { value: 'a-level', label: 'A-Level' }
                  ]}
                  required
                />

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+44 7XXX XXXXXX"
                />

                <div className="flex gap-3">
                  <Button type="submit" isLoading={isLoading}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        username: user.username,
                        student_level: user.student_level,
                        phone: user.phone || ''
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="text-lg font-medium">{user.username}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-medium">{user.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Student Level</p>
                  <p className="text-lg font-medium">
                    {user.student_level === 'gcse' ? 'GCSE' : 'A-Level'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-lg font-medium">{user.phone || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Account Role</p>
                  <p className="text-lg font-medium capitalize">{user.role}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
