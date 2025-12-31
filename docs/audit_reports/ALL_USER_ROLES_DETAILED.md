# 👥 BidRoom - Tamam User Roles Ki Complete Details

## 🎯 Overview
BidRoom mein **6 main user roles** hain. Har role ki apni specific permissions aur capabilities hain.

---

## 📋 All User Roles

### 1️⃣ **PM (Project Manager)** - `role_code: 'PM'`

#### **Kaun hai?**
- Property owners
- Construction project managers
- Companies jo construction work karwana chahte hain

#### **Kya kar sakte hain?**
✅ **Jobs Post kar sakte hain**
- Naye jobs create kar sakte hain
- Job details add kar sakte hain (title, description, budget, location)
- Job status manage kar sakte hain (open/closed)

✅ **Applications Review kar sakte hain**
- Contractors ke applications dekh sakte hain
- Applications accept/reject kar sakte hain
- Contractor profiles dekh sakte hain

✅ **Projects Manage kar sakte hain**
- Naye projects create kar sakte hain
- Project milestones set kar sakte hain
- Project progress track kar sakte hain
- Payments approve kar sakte hain

✅ **Bid Invitations Send kar sakte hain**
- Specific contractors ko invite kar sakte hain
- Bid submissions review kar sakte hain
- Bids award kar sakte hain

✅ **Communication**
- Contractors se message kar sakte hain
- Notifications receive kar sakte hain

#### **Dashboard Features:**
```
📊 Stats:
  - Total Jobs Posted
  - Active Projects
  - Pending Applications
  - Total Spent

📱 Tabs:
  - Home (Dashboard)
  - Jobs (My Posted Jobs)
  - Projects (My Projects)
  - Bids (Sent Invitations)
  - Messages
  - Profile
```

#### **Typical Workflow:**
```
1. Job Post karo
   ↓
2. Applications receive karo
   ↓
3. Best contractor select karo
   ↓
4. Project start karo
   ↓
5. Milestones approve karo
   ↓
6. Payments release karo
```

---

### 2️⃣ **GC (General Contractor)** - `role_code: 'GC'`

#### **Kaun hai?**
- Licensed general contractors
- Construction companies
- Main contractors jo complete projects handle karte hain

#### **Kya kar sakte hain?**
✅ **Jobs Browse kar sakte hain**
- Available jobs dekh sakte hain
- Job details dekh sakte hain
- Jobs filter kar sakte hain (location, budget, trade type)

✅ **Applications Submit kar sakte hain**
- Jobs pe apply kar sakte hain
- Proposed rate submit kar sakte hain
- Cover letter/proposal likh sakte hain
- Portfolio attach kar sakte hain

✅ **Bid Invitations Receive kar sakte hain**
- PM se bid invitations milte hain
- Bid submissions create kar sakte hain
- Competitive bidding kar sakte hain

✅ **Projects Work kar sakte hain**
- Awarded projects pe kaam kar sakte hain
- Milestones complete kar sakte hain
- Progress updates de sakte hain
- Payments receive kar sakte hain

✅ **Sub-contractors Hire kar sakte hain**
- Trade specialists ko hire kar sakte hain
- Work distribute kar sakte hain

#### **Dashboard Features:**
```
📊 Stats:
  - Active Bids
  - Won Projects
  - Pending Applications
  - Total Earnings

📱 Tabs:
  - Home (Dashboard)
  - Jobs (Browse Jobs)
  - Bids (Received Invitations)
  - Projects (My Projects)
  - Messages
  - Profile
```

#### **Typical Workflow:**
```
1. Jobs browse karo
   ↓
2. Suitable job pe apply karo
   ↓
3. Application accepted hone ka wait karo
   ↓
4. Project awarded ho
   ↓
5. Work complete karo
   ↓
6. Milestones submit karo
   ↓
7. Payment receive karo
```

---

### 3️⃣ **TS (Trade Specialist)** - `role_code: 'TS'`

#### **Kaun hai?**
- Specialized contractors
- Electricians
- Plumbers
- HVAC specialists
- Carpenters
- Painters
- Specific trade experts

#### **Kya kar sakte hain?**
✅ **Specialized Jobs Browse kar sakte hain**
- Apne trade ke specific jobs dekh sakte hain
- Filtered job listings (by trade type)

✅ **Applications Submit kar sakte hain**
- Specialized work ke liye apply kar sakte hain
- Technical proposals submit kar sakte hain
- Certifications attach kar sakte hain

✅ **GC ke liye Work kar sakte hain**
- General contractors se sub-contract work le sakte hain
- Specific tasks complete kar sakte hain

✅ **Direct Projects bhi le sakte hain**
- Small specialized projects directly le sakte hain
- Independent work kar sakte hain

#### **Dashboard Features:**
```
📊 Stats:
  - Active Jobs (Trade-specific)
  - Completed Tasks
  - Pending Applications
  - Earnings

📱 Tabs:
  - Home (Dashboard)
  - Jobs (Trade-specific Jobs)
  - Bids (Invitations)
  - Projects (My Work)
  - Messages
  - Profile
```

#### **Typical Workflow:**
```
1. Apne trade ke jobs filter karo
   ↓
2. Suitable job pe apply karo
   ↓
3. Selected ho jao
   ↓
4. Specialized work complete karo
   ↓
5. Quality inspection pass karo
   ↓
6. Payment receive karo
```

#### **GC vs TS Difference:**
```
GC (General Contractor):
- Complete projects handle karte hain
- Multiple trades manage karte hain
- Sub-contractors hire karte hain
- Larger budgets
- Full project responsibility

TS (Trade Specialist):
- Specific trade ka kaam karte hain
- Specialized skills
- Usually sub-contractors ke role mein
- Smaller, focused tasks
- Technical expertise
```

---

### 4️⃣ **VIEWER** - `role_code: 'VIEWER'`

#### **Kaun hai?**
- Potential clients
- People exploring the platform
- Users jo abhi decide nahi kiye
- Observers

#### **Kya kar sakte hain?**
✅ **Limited Access:**
- Jobs browse kar sakte hain (read-only)
- Contractor profiles dekh sakte hain
- Platform explore kar sakte hain
- Pricing dekh sakte hain

❌ **Kya NAHI kar sakte:**
- Jobs post nahi kar sakte
- Applications submit nahi kar sakte
- Bids nahi kar sakte
- Projects create nahi kar sakte
- Messages send nahi kar sakte

#### **Purpose:**
```
VIEWER role temporary hota hai:
  - Naye users ko platform samajhne ke liye
  - Decision making ke liye
  - Eventually PM ya Contractor ban sakte hain
```

#### **Dashboard Features:**
```
📊 Limited View:
  - Browse Jobs (read-only)
  - View Contractors
  - Platform Features
  - Upgrade Options

📱 Tabs:
  - Home (Info Dashboard)
  - Jobs (Browse Only)
  - Contractors (View Only)
  - Upgrade (Become PM/GC)
```

---

### 5️⃣ **ADMIN** - `role_code: 'ADMIN'`

#### **Kaun hai?**
- Platform administrators
- Support team
- Moderators

#### **Kya kar sakte hain?**
✅ **User Management**
- Users ko view/edit kar sakte hain
- User accounts suspend kar sakte hain
- Verification approve kar sakte hain

✅ **Content Moderation**
- Jobs review kar sakte hain
- Inappropriate content remove kar sakte hain
- Disputes handle kar sakte hain

✅ **Platform Monitoring**
- All jobs dekh sakte hain
- All projects monitor kar sakte hain
- Analytics dekh sakte hain
- Reports generate kar sakte hain

✅ **Financial Operations**
- Payouts manage kar sakte hain
- Escrow monitor kar sakte hain
- Transactions review kar sakte hain

#### **Admin Panel Features:**
```
📊 Sections:
  - Dashboard (Overview)
  - Users (All Users)
  - Jobs (All Jobs)
  - Projects (All Projects)
  - Financials (Transactions)
  - Disputes
  - Reports
  - Settings
```

---

### 6️⃣ **SUPER (Super Admin)** - `role_code: 'SUPER'`

#### **Kaun hai?**
- System owner
- Technical administrators
- Highest level access

#### **Kya kar sakte hain?**
✅ **Everything Admin can do, PLUS:**
- System configuration
- Admin users create kar sakte hain
- Database access
- Platform settings change kar sakte hain
- Critical operations perform kar sakte hain

✅ **Full Control:**
- All features
- All data
- All users
- All settings

---

## 🔐 Permissions Matrix

| Feature | PM | GC | TS | VIEWER | ADMIN | SUPER |
|---------|----|----|-------|---------|-------|-------|
| Browse Jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post Jobs | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Apply to Jobs | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create Projects | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Submit Bids | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Send Messages | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎬 Real-World Examples

### **Example 1: Kitchen Renovation**
```
PM (Homeowner):
  - Kitchen renovation ka job post karta hai
  - Budget: $20,000 - $30,000
  - Location: San Francisco

GC (General Contractor):
  - Job dekh kar apply karta hai
  - Proposal: $25,000, 4 weeks
  - Portfolio attach karta hai

PM:
  - GC ka application accept karta hai
  - Project start hota hai

GC:
  - TS (Electrician) hire karta hai
  - TS (Plumber) hire karta hai
  - Work coordinate karta hai

TS (Electrician):
  - Electrical work complete karta hai
  - $3,000 earn karta hai

TS (Plumber):
  - Plumbing work complete karta hai
  - $2,500 earn karta hai

GC:
  - Complete project deliver karta hai
  - $25,000 receive karta hai
  - Sub-contractors ko pay karta hai
```

### **Example 2: HVAC Installation**
```
PM (Building Manager):
  - HVAC installation job post karta hai

TS (HVAC Specialist):
  - Directly apply karta hai (GC ki zarurat nahi)
  - Specialized proposal submit karta hai
  - Certifications show karta hai

PM:
  - TS ko directly hire karta hai
  - Project complete hota hai
```

---

## 🔄 Role Switching

### **Kya users apna role change kar sakte hain?**

**Haan, lekin limited:**

1. **VIEWER → PM/GC/TS**
   - Profile complete karo
   - Verification process
   - Admin approval

2. **GC ↔ TS**
   - Dual role possible
   - GC bhi ho sakte ho aur TS bhi
   - Different projects ke liye different roles

3. **Cannot become ADMIN/SUPER**
   - Ye roles platform owner assign karta hai
   - Application process nahi hai

---

## 📱 Mobile App Access

### **Sabhi roles mobile app use kar sakte hain:**

```
PM App:
  - Job posting
  - Application review
  - Project management
  - Communication

GC/TS App:
  - Job browsing
  - Bid submission
  - Project work
  - Earnings tracking

VIEWER App:
  - Browse only
  - Explore platform
  - Upgrade options

ADMIN App:
  - Admin Panel
  - User management
  - Monitoring
```

---

## 🎓 Getting Started Guide

### **Agar aap PM banna chahte ho:**
1. Sign up karo
2. Profile complete karo
3. Payment method add karo
4. Pehla job post karo

### **Agar aap GC/TS banna chahte ho:**
1. Sign up karo
2. Professional profile banao
3. Portfolio add karo
4. Certifications upload karo
5. Jobs browse karo aur apply karo

### **Agar aap VIEWER ho:**
1. Platform explore karo
2. Decide karo: PM ya Contractor?
3. Profile upgrade karo

---

## 🆘 Support

### **Har role ke liye support:**
- In-app messaging
- Help center
- Email support
- Admin assistance

---

## 🔑 Test Accounts

```
PM Account:
  Email: pikachugaming899@gmail.com
  Password: ayan1212
  Role: PM

GC Account:
  Email: gc@bidroom.com
  Password: ayan1212
  Role: GC

Super Admin:
  Email: superadmin@bidroom.com
  Password: password123
  Role: SUPER
```

---

Ye document sabhi roles ki complete details hai. Koi bhi specific role ke baare mein aur detail chahiye to batao!
