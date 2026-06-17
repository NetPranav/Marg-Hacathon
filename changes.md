# Changelog

This document tracks all the modifications made to the `marg` codebase (including `marg-backend` and `marg-driver`), along with the exact code changes for each file.

## Changes

### 1. Remove Assigned Vehicle input from Driver Creation Form
**File**: `marg/marg-driver/src/app/admin/organization/drivers/page.tsx`
**Description**: Removed the `assigned_vehicle` from form state, eliminated the `trucks` fetching logic, and removed the select input field from the UI since vehicle assignment is now handled during vehicle creation.

**Exact Code Changes:**
```diff
@@ -25,7 +25,6 @@
   const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null);
   const [showPassword, setShowPassword] = useState(false);
   const [copied, setCopied] = useState(false);
-  const [trucks, setTrucks] = useState<any[]>([]);
 
   const [form, setForm] = useState({
     first_name: "",
@@ -32,7 +32,6 @@
     phone: "",
     employee_id: "",
     license_number: "",
-    assigned_vehicle: "",
   });
 
   useEffect(() => {
@@ -40,14 +40,9 @@
 
   const loadData = async () => {
     try {
-      const [driversRes, trucksRes] = await Promise.allSettled([
-        api.get("/drivers/"),
-        api.get("/trucks/"),
-      ]);
-      const driverList = driversRes.status === "fulfilled" ? (Array.isArray(driversRes.value.data) ? driversRes.value.data : driversRes.value.data.results || []) : [];
-      const truckList = trucksRes.status === "fulfilled" ? (Array.isArray(trucksRes.value.data) ? trucksRes.value.data : trucksRes.value.data.results || []) : [];
+      const driversRes = await api.get("/drivers/");
+      const driverList = Array.isArray(driversRes.data) ? driversRes.data : driversRes.data.results || [];
       setDrivers(driverList);
-      setTrucks(truckList);
     } catch (err) {
       console.error("Load error:", err);
     } finally {
@@ -83,7 +83,7 @@
 
       setCreatedCreds({ username, password });
       setShowForm(false);
-      setForm({ first_name: "", last_name: "", phone: "", employee_id: "", license_number: "", assigned_vehicle: "" });
+      setForm({ first_name: "", last_name: "", phone: "", employee_id: "", license_number: "" });
       loadData();
     } catch (err) {
       console.error("Create driver error:", err);
@@ -200,19 +200,6 @@
                 />
               </div>
             ))}
-            <div>
-              <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Assigned Vehicle</label>
-              <select
-                value={form.assigned_vehicle}
-                onChange={(e) => setForm({ ...form, assigned_vehicle: e.target.value })}
-                className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
-              >
-                <option value="">Select vehicle...</option>
-                {trucks.map((t: any) => (
-                  <option key={t.id} value={t.id}>{t.registration_number || t.vehicle_number || `Truck #${t.id}`}</option>
-                ))}
-              </select>
-            </div>
           </div>
           <p className="text-xs text-brand-muted mt-3 flex items-center gap-1.5">
             <KeyRound size={11} /> System will auto-generate username and temporary password.
```

### 2. Add Employee ID to Driver and Prefill in UI
**Files**: 
- `marg/marg-backend/fleet/models.py`
- `marg/marg-backend/accounts/views.py`
- `marg/marg-backend/fleet/serializers.py`
- `marg/marg-driver/src/app/admin/organization/drivers/page.tsx`
**Description**: Added `employee_id` to the `Driver` model, exposed it in serializers, updated the provisioning API, and modified the frontend to auto-prefill `employee_id` to `"drv-" + drivers.length` on clicking "Create Driver Account". Also added it to the driver list UI.

### 3. Enhance Vehicle Card Functionality
**File**: `marg/marg-driver/src/app/admin/fleet/vehicles/page.tsx`
**Description**: Added `Pencil` and `Trash2` icons for editing and deleting vehicles. Implemented `handleSave` to issue `PATCH` requests when editing. Added `handleDelete` to issue `DELETE` requests. Fixed capacity display to correctly divide `capacity_kg` by 1000. Changed driver display to use `v.assigned_driver_name` with a User icon.

### 4. Fix Empty Company Profile Fields
**Files**:
- `marg/marg-driver/src/app/admin/organization/profile/page.tsx`
- `marg/marg-backend/accounts/views.py`
**Description**: Updated frontend `page.tsx` data loader to check `org.metadata` when trying to retrieve nested registration variables like `registration_number` and `coverage_regions`, and properly map `phone_number` and `address`. Updated backend `LogisticsRegistrationView` to store standard fields like `company_address` and `gst_number` directly onto the `Organization` database model instead of burying them inside the `metadata` JSON field.

### 5. Fix Factory Registration 500 Error
**File**: `marg/marg-backend/accounts/views.py`
**Description**: Fixed a `TypeError` in `FactoryRegistrationView` which was caused by attempting to save the `pincode` payload to a non-existent `postal_code` column on the `Factory` model. The pincode is now safely appended directly to the end of the `address` field before the database row is created.

### 6. Fix Incorrect Factory Assignment and Name Display
**Files**: 
- `marg/marg-backend/accounts/serializers.py`
- `marg/marg-backend/shipments/serializers.py`
**Description**: Updated `AuthUserSerializer` to serialize `organization` dynamically and include a nested list of `factories` using `OrganizationMiniSerializer`. This ensures the Factory portal reads the correct factory ID on load rather than falling back to ID 1 ("Mumbai Plant"). Modified `LotSerializer`, `ShipmentSerializer`, and `ShipmentListSerializer` to calculate `factory_name` dynamically with the city appended, ensuring the Logistics portal displays "Factory Name (City)" instead of just the factory name.

### 7. Fix Frontend Factory Fallback Bug and Migrate Existing Lots
**Files**:
- `marg/marg-factory/src/pages/CreateLotPage.tsx`
- Database
**Description**: Fixed an object traversal bug in the frontend `CreateLotPage` where `res.data.organization` was evaluating to `undefined` because Axios nests the response body in `res.data.data`. Wrote a python script to iterate over the database and fix all previously corrupted Lots that were accidentally assigned to "Mumbai Plant", correcting their `factory_id` to point to the user's actual factory.
