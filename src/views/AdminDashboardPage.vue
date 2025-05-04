<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">Admin Dashboard</h1>
      
      <div v-if="!isAdmin" class="bg-red-500 bg-opacity-20 text-red-400 p-4 rounded-md mb-6">
        <p>You don't have permission to access this page. Admin privileges required.</p>
      </div>
      
      <div v-else>
        <!-- Dashboard Tabs -->
        <div class="mb-6">
          <nav class="flex border-b border-[#737373]">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="py-2 px-4 -mb-px text-lg"
              :class="activeTab === tab.id ? 'border-b-2 border-[#533673] text-[#D9D9D9] font-medium' : 'text-[#737373]'"
            >
              {{ tab.name }}
            </button>
          </nav>
        </div>
        
        <!-- Monitored Users -->
        <div v-if="activeTab === 'monitored'" class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">Monitored Users</h2>
            <button 
              @click="refreshMonitoredUsers"
              class="px-4 py-2 flex items-center gap-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors"
              :disabled="isLoadingMonitored"
            >
              <RefreshCcw v-if="!isLoadingMonitored" :size="16" />
              <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[#D9D9D9]"></div>
              <span>Refresh</span>
            </button>
          </div>
          
          <div v-if="isLoadingMonitored" class="py-6 text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#533673] mx-auto"></div>
            <p class="mt-2 text-[#737373]">Loading monitored users...</p>
          </div>
          
          <div v-else-if="monitoredUsers.length === 0" class="bg-[#232323] rounded-lg border border-[#737373] p-6 text-center">
            <div class="text-[#737373] mb-2">No users are currently being monitored</div>
            <p class="text-[#737373] text-sm">Users performing suspicious activities will appear here</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full bg-[#232323] rounded-lg border border-[#737373]">
              <thead class="bg-[#1A1A1A]">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">User ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Name</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Email</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Reason</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Detection Time</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#333333]">
                <tr 
                  v-for="user in monitoredUsers" 
                  :key="user.id"
                  class="hover:bg-[#282828]"
                >
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ user.id }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ user.name }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ user.email }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ user.reason }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ formatDate(user.detection_time) }}</td>
                  <td class="px-4 py-3 text-sm">
                    <div class="flex space-x-2">
                      <button 
                        @click="viewUserActivity(user.id)"
                        class="px-2 py-1 bg-[#533673] bg-opacity-20 text-[#533673] rounded hover:bg-opacity-30 transition-colors"
                      >
                        View Activity
                      </button>
                      <button 
                        @click="dismissUser(user.id)"
                        class="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded hover:bg-opacity-30 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Activity Logs -->
        <div v-if="activeTab === 'activity'" class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">User Activity Logs</h2>
            <div class="flex space-x-2">
              <select 
                v-model="activityFilter"
                class="bg-[#232323] text-[#D9D9D9] border border-[#737373] rounded-md px-3 py-2"
              >
                <option value="all">All Activities</option>
                <option value="CREATE">Create Operations</option>
                <option value="UPDATE">Update Operations</option>
                <option value="DELETE">Delete Operations</option>
                <option value="READ">Read Operations</option>
              </select>
              
              <button 
                @click="refreshActivityLogs"
                class="px-4 py-2 flex items-center gap-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors"
                :disabled="isLoadingActivity"
              >
                <RefreshCcw v-if="!isLoadingActivity" :size="16" />
                <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[#D9D9D9]"></div>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <div v-if="isLoadingActivity" class="py-6 text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#533673] mx-auto"></div>
            <p class="mt-2 text-[#737373]">Loading activity logs...</p>
          </div>
          
          <div v-else-if="activityLogs.length === 0" class="bg-[#232323] rounded-lg border border-[#737373] p-6 text-center">
            <div class="text-[#737373] mb-2">No activity logs found</div>
            <p class="text-[#737373] text-sm">User actions will be recorded here</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full bg-[#232323] rounded-lg border border-[#737373]">
              <thead class="bg-[#1A1A1A]">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">User</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Action</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Entity Type</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Entity ID</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">Timestamp</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-[#D9D9D9]">IP Address</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#333333]">
                <tr 
                  v-for="log in filteredActivityLogs" 
                  :key="log.id"
                  class="hover:bg-[#282828]"
                >
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ log.user_name || log.user_id }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span 
                      class="px-2 py-1 rounded text-xs font-medium"
                      :class="getActionClass(log.action_type)"
                    >
                      {{ log.action_type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ log.entity_type }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ log.entity_id }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ formatDate(log.timestamp) }}</td>
                  <td class="px-4 py-3 text-sm text-[#D9D9D9]">{{ log.ip_address }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Simulation Controls -->
        <div v-if="activeTab === 'simulation'" class="mb-8">
          <div class="bg-[#232323] rounded-lg border border-[#737373] p-6">
            <h2 class="text-xl font-semibold mb-4">Simulate Suspicious Activity</h2>
            
            <div class="mb-6">
              <p class="text-[#D9D9D9] mb-4">
                Use this tool to simulate a user performing a high number of CRUD operations in a short time, 
                which should trigger the monitoring system to flag the user as suspicious.
              </p>
              
              <div class="bg-amber-500 bg-opacity-10 text-amber-400 p-4 rounded-md mb-4">
                <AlertTriangle :size="20" class="inline-block mr-2" />
                <span>This is for testing purposes only. It will generate actual database entries.</span>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-medium mb-4">Configuration</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm text-[#737373] mb-2">Select User</label>
                    <select 
                      v-model="simulationUserId" 
                      class="w-full bg-[#232323] border border-[#737373] rounded-md py-2 px-3 text-[#D9D9D9]"
                    >
                      <option v-for="user in usersList" :key="user.id" :value="user.id">
                        {{ user.name }} ({{ user.email }})
                      </option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm text-[#737373] mb-2">Operation Count</label>
                    <input 
                      v-model.number="simulationCount" 
                      type="number" 
                      min="10" 
                      max="200"
                      class="w-full bg-[#232323] border border-[#737373] rounded-md py-2 px-3 text-[#D9D9D9]"
                    />
                    <span class="text-xs text-[#737373] mt-1 block">
                      Number of operations to perform (10-200)
                    </span>
                  </div>
                  
                  <div>
                    <label class="block text-sm text-[#737373] mb-2">Operation Type</label>
                    <select 
                      v-model="simulationType" 
                      class="w-full bg-[#232323] border border-[#737373] rounded-md py-2 px-3 text-[#D9D9D9]"
                    >
                      <option value="CREATE">CREATE</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                      <option value="MIXED">MIXED (All types)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm text-[#737373] mb-2">Speed</label>
                    <select 
                      v-model="simulationSpeed" 
                      class="w-full bg-[#232323] border border-[#737373] rounded-md py-2 px-3 text-[#D9D9D9]"
                    >
                      <option value="FAST">Fast (Immediate)</option>
                      <option value="MEDIUM">Medium (100ms delay)</option>
                      <option value="SLOW">Slow (250ms delay)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg font-medium mb-4">Execution</h3>
                
                <div class="bg-[#1A1A1A] rounded-lg p-4 mb-4 h-40 overflow-auto">
                  <p v-if="simulationLogs.length === 0" class="text-[#737373] text-center py-10">
                    Simulation logs will appear here
                  </p>
                  <div v-else>
                    <div v-for="(log, index) in simulationLogs" :key="index" class="text-sm mb-2">
                      <span
                        class="px-1 rounded text-xs font-medium mr-1"
                        :class="getActionClass(log.action)"
                      >
                        {{ log.action }}
                      </span>
                      <span class="text-[#D9D9D9]">{{ log.message }}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <button
                    @click="startSimulation"
                    class="w-full py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                    :disabled="isSimulating"
                  >
                    <Play v-if="!isSimulating" :size="16" />
                    <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                    <span>{{ isSimulating ? 'Simulating...' : 'Start Simulation' }}</span>
                  </button>
                  
                  <div v-if="isSimulating" class="mt-4">
                    <div class="w-full bg-[#333333] rounded-full h-2">
                      <div
                        class="bg-[#533673] h-2 rounded-full"
                        :style="`width: ${simulationProgress}%`"
                      ></div>
                    </div>
                    <div class="text-xs text-[#737373] mt-1 text-right">
                      {{ Math.round(simulationProgress) }}% complete
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RefreshCcw, AlertTriangle, Play } from 'lucide-vue-next';
import AppLayout from '../components/AppLayout.vue';
import { useAuthStore } from '../store/auth';
import api from '../store/api';

interface MonitoredUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  reason: string;
  detection_time: string;
  is_active: boolean;
  details: any;
}

interface ActivityLog {
  id: number;
  user_id: string;
  user_name?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  ip_address: string;
  details?: any;
}

const authStore = useAuthStore();
const currentUser = authStore.getUser();
const isAdmin = computed(() => currentUser?.role === 'ADMIN');

// Tabs
const tabs = [
  { id: 'monitored', name: 'Monitored Users' },
  { id: 'activity', name: 'Activity Logs' },
  { id: 'simulation', name: 'Simulation' }
];
const activeTab = ref('monitored');

// Monitored Users
const monitoredUsers = ref<MonitoredUser[]>([]);
const isLoadingMonitored = ref(false);

// Activity Logs
const activityLogs = ref<ActivityLog[]>([]);
const isLoadingActivity = ref(false);
const activityFilter = ref('all');

// Users list for simulation
const usersList = ref<any[]>([]);

// Simulation
const simulationUserId = ref('');
const simulationCount = ref(50);
const simulationType = ref('CREATE');
const simulationSpeed = ref('MEDIUM');
const isSimulating = ref(false);
const simulationProgress = ref(0);
const simulationLogs = ref<{action: string, message: string}[]>([]);

// Computed
const filteredActivityLogs = computed(() => {
  if (activityFilter.value === 'all') {
    return activityLogs.value;
  }
  return activityLogs.value.filter(log => log.action_type === activityFilter.value);
});

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const getActionClass = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-green-500 bg-opacity-20 text-green-400';
    case 'UPDATE':
      return 'bg-blue-500 bg-opacity-20 text-blue-400';
    case 'DELETE':
      return 'bg-red-500 bg-opacity-20 text-red-400';
    case 'READ':
      return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
    default:
      return 'bg-gray-500 bg-opacity-20 text-gray-400';
  }
};

const refreshMonitoredUsers = async () => {
  if (!isAdmin.value) return;
  
  isLoadingMonitored.value = true;
  
  try {
    // Add null check before accessing currentUser.id
    if (!currentUser) {
      console.error('User not logged in');
      return;
    }
    
    const response = await api.get('/monitored-users/', {
      params: { user_id: currentUser.id }
    });
    monitoredUsers.value = response.data;
  } catch (error) {
    console.error('Error fetching monitored users:', error);
  } finally {
    isLoadingMonitored.value = false;
  }
};

const refreshActivityLogs = async () => {
  if (!isAdmin.value) return;
  
  isLoadingActivity.value = true;
  
  try {
    // Add null check before accessing currentUser.id
    if (!currentUser) {
      console.error('User not logged in');
      return;
    }
    
    const response = await api.get('/activity-logs/', {
      params: { user_id: currentUser.id }
    });
    activityLogs.value = response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
  } finally {
    isLoadingActivity.value = false;
  }
};

const loadUsersList = async () => {
  try {
    // Add null check before accessing currentUser.id
    if (!currentUser) {
      console.error('User not logged in');
      return;
    }
    
    const response = await api.get('/users/', {
      params: { user_id: currentUser.id }
    });
    usersList.value = response.data;
    
    if (usersList.value.length > 0 && !simulationUserId.value) {
      simulationUserId.value = usersList.value[0].id;
    }
  } catch (error) {
    console.error('Failed to load users list:', error);
  }
};

const viewUserActivity = (userId: string) => {
  activeTab.value = 'activity';
  // Filter activity logs to show only this user's activity
  // In a real implementation, you'd fetch specific user's logs
};

const dismissUser = async (userId: string) => {
  try {
    await api.post(`/monitored-users/${userId}/dismiss/`);
    await refreshMonitoredUsers();
  } catch (error) {
    console.error('Failed to dismiss monitored user:', error);
  }
};

const startSimulation = async () => {
  if (isSimulating.value || !simulationUserId.value) return;
  
  isSimulating.value = true;
  simulationProgress.value = 0;
  simulationLogs.value = [];
  
  const totalOperations = simulationCount.value;
  const delayMs = simulationSpeed.value === 'FAST' ? 0 : 
                  simulationSpeed.value === 'MEDIUM' ? 100 : 250;
  
  try {
    // First approach: Use the backend simulation endpoint for all operations at once
    if (delayMs === 0) {
        simulationLogs.value.push({
            action: 'info',
            message: `Starting simulation with ${totalOperations} operations`
        });
        
        try {
            // Add null check before accessing currentUser.id
            if (!currentUser) {
            console.error('User not logged in');
            throw new Error('User not logged in');
            }
            
            const response = await api.post('/simulate-attack/', {
            operation_type: simulationType.value,
            operation_count: totalOperations,
            target_user_id: simulationUserId.value // Add this line to pass the selected user ID
            }, {
            params: { user_id: currentUser.id }
            });
            
            if (response.data.operation_counts) {
            const counts = response.data.operation_counts;
            
            // Add detailed log entries for each operation type
            Object.entries(counts).forEach(([type, count]) => {
                simulationLogs.value.push({
                action: type.toLowerCase(),
                message: `${count} ${type} operations completed`
                });
            });
            }
            
            simulationLogs.value.push({
            action: 'success',
            message: `Simulation completed: ${response.data.operations_completed} operations`
            });
        } catch (error : any) {
            simulationLogs.value.push({
            action: 'error',
            message: `Simulation failed: ${error.message || 'Unknown error'}`
            });
            throw error;
        }
    }
    // Second approach: Perform operations one by one with delay for visual effect
    else {
      simulationLogs.value.push({
        action: 'INFO',
        message: `Starting simulation with ${totalOperations} operations`
      });
      
      for (let i = 0; i < totalOperations; i++) {
        // Determine operation type for this iteration
        let operationType = simulationType.value;
        if (simulationType.value === 'MIXED') {
          const types = ['CREATE', 'UPDATE', 'DELETE'];
          operationType = types[Math.floor(Math.random() * types.length)];
        }
        
        // Perform single operation
        try {
          if (operationType === 'CREATE') {
            await api.post('/events/', {
              title: `Simulated Event ${i}`,
              description: `This is a simulated event created during attack simulation`,
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
              location: 'Simulation',
              category: 'Test',
              created_by: simulationUserId.value
            });
          } else if (operationType === 'UPDATE') {
            // For update operations, first get an existing event
            const eventsResponse = await api.get(`/users/${simulationUserId.value}/events/`);
            if (eventsResponse.data && eventsResponse.data.length > 0) {
              const event = eventsResponse.data[Math.floor(Math.random() * eventsResponse.data.length)];
              await api.patch(`/events/${event.id}/`, {
                title: `Updated Event ${i}`,
                description: `This event was updated during attack simulation`
              });
            } else {
              // If no events to update, create one instead
              await api.post('/events/', {
                title: `Simulated Event ${i}`,
                description: `This is a simulated event created during attack simulation`,
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                location: 'Simulation',
                category: 'Test',
                created_by: simulationUserId.value
              });
            }
          } else if (operationType === 'DELETE') {
            // For delete operations, first get an existing event
            const eventsResponse = await api.get(`/users/${simulationUserId.value}/events/`);
            if (eventsResponse.data && eventsResponse.data.length > 0) {
              const event = eventsResponse.data[Math.floor(Math.random() * eventsResponse.data.length)];
              await api.delete(`/events/${event.id}/`);
            } else {
              // If no events to delete, create one instead
              await api.post('/events/', {
                title: `Simulated Event ${i}`,
                description: `This is a simulated event created during attack simulation`,
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                location: 'Simulation',
                category: 'Test',
                created_by: simulationUserId.value
              });
            }
          }
          
          simulationLogs.value.push({
            action: operationType,
            message: `Operation ${i+1}/${totalOperations} completed`
          });
          simulationProgress.value = ((i + 1) / totalOperations) * 100;
          
          // Add delay between operations
          if (delayMs > 0 && i < totalOperations - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        } catch (opError : any) {
          simulationLogs.value.push({
            action: 'ERROR',
            message: `Operation ${i+1} failed: ${opError.message || 'Unknown error'}`
          });
        }
      }
      
      // Check if user is now monitored
      await refreshMonitoredUsers();
      const isNowMonitored = monitoredUsers.value.some(user => user.user_id === simulationUserId.value);
      
      if (isNowMonitored) {
        simulationLogs.value.push({
          action: 'WARNING',
          message: `User was flagged as suspicious and added to monitored list!`
        });
      } else {
        simulationLogs.value.push({
          action: 'INFO',
          message: `Simulation completed but user was not added to monitored list yet. The monitoring thread may not have run yet.`
        });
      }
    }
  } catch (error : any) {
    console.error('Simulation failed:', error);
    simulationLogs.value.push({
      action: 'ERROR',
      message: `Simulation failed: ${error.message || 'Unknown error'}`
    });
  } finally {
    isSimulating.value = false;
    await refreshMonitoredUsers();
    await refreshActivityLogs();
  }
};

// Initialize
onMounted(async () => {
  if (isAdmin.value) {
    await refreshMonitoredUsers();
    await refreshActivityLogs();
    await loadUsersList();
  }
});
</script>