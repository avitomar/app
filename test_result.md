#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build a full-scale SaaS Android app for Paper & Stationery Manufacturing Factories.
  Core Production Flow: Raw Material → Production → Inventory → Sales
  Multi-role system with Emergent Google OAuth authentication.
  Industry-standard GSM calculations for paper weight.

backend:
  - task: "Authentication System (Emergent Google OAuth)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Implemented complete OAuth flow with session management:
          - POST /api/auth/session - Exchange session_id for user data
          - GET /api/auth/me - Get current authenticated user
          - POST /api/auth/logout - Logout and clear session
          Uses MongoDB for users and user_sessions collections.
          Custom user_id field to avoid _id serialization issues.
          Role-based access with UserRole enum (owner, production_manager, inventory_manager, sales_manager, operator).
  
  - task: "Raw Material Management API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Implemented material tracking with GSM calculations:
          - POST /api/materials - Create raw material with auto weight calculation
          - GET /api/materials - List all materials
          - GET /api/materials/low-stock - Get materials below reorder level
          - PUT /api/materials/{material_id}/stock - Update stock levels
          Industry formula: Sheet Weight (kg) = (Length × Width × GSM) / 1550000
          Supports both SHEET and REEL material types.
  
  - task: "Machine Management API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Machine tracking endpoints:
          - POST /api/machines - Create machine (requires owner/production_manager role)
          - GET /api/machines - List all machines
          Tracks machine type, status (active/maintenance/inactive).
  
  - task: "Job Card Management API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Production job tracking:
          - POST /api/jobs - Create job card with auto job number generation
          - GET /api/jobs - List jobs with optional status filter
          - PUT /api/jobs/{job_id} - Update job status, material consumption, wastage
          Tracks: pending, in_progress, completed, cancelled status.
          Links to materials and machines.
  
  - task: "Production Log API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Shift-wise production tracking:
          - POST /api/production-logs - Create production log entry
          - GET /api/production-logs - List logs with optional job_id filter
          Tracks: shift, produced_quantity, wastage_quantity, downtime_minutes.
  
  - task: "Inventory Management API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Finished and semi-finished goods tracking:
          - POST /api/inventory - Create inventory item
          - GET /api/inventory - List inventory with finished/semi-finished filter
          Tracks: SKU, batch_number, quantity, unit_weight, unit_cost.
  
  - task: "Customer Management API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Customer/dealer management:
          - POST /api/customers - Create customer (requires owner/sales_manager role)
          - GET /api/customers - List all customers
          Tracks: contact details, GSTIN, credit_limit, outstanding amount.
  
  - task: "Sales Order API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Order management with GST calculation:
          - POST /api/orders - Create order with auto GST calculation (18%)
          - GET /api/orders - List orders with status filter
          - PUT /api/orders/{order_id}/status - Update order status
          Auto generates order numbers. Tracks dispatch dates.
  
  - task: "Dashboard Statistics API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Owner dashboard metrics:
          - GET /api/dashboard/stats - Real-time statistics
          Returns: total_production_today, pending_orders, machine_utilization_percent,
          paper_stock_tons, daily_revenue, active_jobs, low_stock_materials.

frontend:
  - task: "Authentication Flow (Google OAuth)"
    implemented: true
    working: "NA"
    file: "frontend/app/login.tsx, frontend/app/auth/callback.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Implemented complete OAuth flow:
          - Login screen with Google sign-in button
          - Auth callback handler processes session_id
          - Stores session_token in AsyncStorage
          - Redirects to dashboard after successful auth
          Uses useRef to prevent race conditions in StrictMode.
  
  - task: "Navigation Structure"
    implemented: true
    working: "NA"
    file: "frontend/app/_layout.tsx, frontend/app/(tabs)/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Bottom tab navigation with 5 main tabs:
          - Dashboard (stats and overview)
          - Production (materials, jobs, logs, machines)
          - Inventory (finished/semi-finished goods)
          - Sales (customers, orders, invoices)
          - Profile (user settings and logout)
          Auth check on app load, redirects to login if not authenticated.
  
  - task: "Dashboard Screen"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Real-time dashboard with pull-to-refresh:
          - Production today stats
          - Pending orders count
          - Machine utilization percentage
          - Paper stock in tons
          - Daily revenue
          - Active jobs
          - Low stock alerts
          Displays user name, role badge, and notifications icon.
  
  - task: "Raw Materials Management UI"
    implemented: true
    working: "NA"
    file: "frontend/app/production/materials.tsx, frontend/app/production/materials/add.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Material tracking screens:
          - List view with material cards showing GSM, quantity, weight, rate
          - Low stock visual indicators
          - Add material form with sheet/reel type selector
          - Auto weight calculation explanation
          - Reorder level tracking
          Pull-to-refresh enabled.
  
  - task: "Production, Inventory, Sales Navigation"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/production.tsx, inventory.tsx, sales.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Main hub screens with quick action menus:
          - Production: Materials, Machines, Job Cards, Production Logs
          - Inventory: Finished Goods, Semi-Finished, SKU, Batch Tracking
          - Sales: Customers, Orders, Invoices, Outstanding, Dispatch
          Floating action buttons for quick adds.
  
  - task: "Profile & Settings Screen"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          User profile with:
          - Profile picture and name
          - Role badge display
          - Settings menu items
          - Logout functionality with confirmation dialog
          Shows app version.

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Authentication System (Emergent Google OAuth)"
    - "Dashboard Statistics API"
    - "Raw Material Management API"
    - "Raw Materials Management UI"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Initial implementation complete for Paper Factory SaaS MVP.
      
      Backend: All core APIs implemented with:
      - Multi-role authentication (5 roles)
      - Raw material tracking with GSM calculations
      - Job card and production log management
      - Inventory and sales order tracking
      - Dashboard statistics aggregation
      
      Frontend: Mobile-first UI with:
      - Google OAuth login flow
      - Bottom tab navigation (5 tabs)
      - Dashboard with real-time stats
      - Material management with add form
      - Role-based UI considerations
      
      Ready for backend API testing. Please test:
      1. Auth endpoints (/api/auth/session, /api/auth/me)
      2. Materials CRUD (/api/materials)
      3. Dashboard stats (/api/dashboard/stats)
      4. All other module APIs
      
      Frontend testing should come after backend is validated.