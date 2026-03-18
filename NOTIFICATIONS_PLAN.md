# 🔔 Notifications System - Implementation Plan

## 📋 Overview
Comprehensive notification system for social interactions: follows, likes, comments, mentions, and journey milestones.

---

## 🎯 Notification Types

### **1. Follow Notifications** ✅ Priority 1
```
👤 John Smith started following you
   [View Profile] [Follow Back]
   2 hours ago
```

### **2. Like Notifications** ✅ Priority 1
```
❤️ Sarah and 12 others liked your post "Epic Road Trip"
   [View Post]
   5 hours ago
```

### **3. Comment Notifications** ✅ Priority 2
```
💬 Mike commented: "Amazing photos! Where is this?"
   [Reply] [View Post]
   1 day ago
```

### **4. Mention Notifications** ✅ Priority 2
```
@️⃣ Emma mentioned you in a post
   "Traveling with @john_smith through Europe!"
   [View Post]
   3 days ago
```

### **5. Trip Start Notifications** ✅ Priority 3
```
🚀 John Smith started a new journey "Paris to Istanbul"
   [View Trip]
   1 week ago
```

### **6. Milestone Notifications** ✅ Priority 3
```
🏅 Sarah captured a medallion in "Tokyo"
   [View Medallion]
   2 weeks ago
```

---

## 🗄️ Firestore Schema

### **notifications collection**
```typescript
{
  id: string;                    // Auto-generated
  recipientId: string;           // User who receives notification
  senderId: string;              // User who triggered notification
  senderName: string;
  senderPhotoUrl?: string;
  
  type: 'follow' | 'like' | 'comment' | 'mention' | 'trip_start' | 'milestone';
  
  // Content reference (varies by type)
  postId?: string;               // For like, comment, mention
  commentId?: string;            // For comment
  tripId?: string;               // For trip_start, milestone
  medallionId?: string;          // For milestone
  
  // Metadata
  text?: string;                 // Comment text, caption excerpt
  photoUrl?: string;             // Preview image
  
  // State
  isRead: boolean;
  createdAt: Timestamp;
}
```

### **Firestore Rules**
```javascript
match /notifications/{notificationId} {
  // Users can only read their own notifications
  allow read, list: if request.auth != null && 
    request.auth.uid == resource.data.recipientId;
  
  // Only the system/sender can create notifications
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.senderId;
  
  // Users can only update their own notifications (mark as read)
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.recipientId &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
  
  // Users can delete their own notifications
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.recipientId;
}
```

### **Firestore Indexes**
```json
{
  "collectionGroup": "notifications",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "isRead", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "notifications",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## 🔧 Service Architecture

### **NotificationService.ts**
```typescript
class NotificationService {
  // Create notifications
  async createFollowNotification(senderId, senderName, senderPhoto, recipientId)
  async createLikeNotification(senderId, senderName, senderPhoto, recipientId, postId, postTitle, postPhoto)
  async createCommentNotification(senderId, senderName, senderPhoto, recipientId, postId, commentId, commentText)
  async createMentionNotification(senderId, senderName, senderPhoto, recipientId, postId, caption)
  async createTripStartNotification(senderId, senderName, senderPhoto, recipientId, tripId, tripTitle)
  async createMilestoneNotification(senderId, senderName, senderPhoto, recipientId, tripId, medallionId, location)
  
  // Read notifications
  async getNotifications(userId, options?: { limit?, cursor?, unreadOnly? })
  async getUnreadCount(userId)
  async getGroupedNotifications(userId) // Group by type and time
  
  // Update notifications
  async markAsRead(notificationId, userId)
  async markAllAsRead(userId)
  async deleteNotification(notificationId, userId)
  async deleteAllRead(userId)
}
```

---

## 🎨 UI Components

### **NotificationsList.tsx** (Main)
```tsx
<div className="notifications-feed">
  {/* Header with actions */}
  <header>
    <h2>Notifications</h2>
    <button onClick={markAllAsRead}>Mark all as read</button>
  </header>
  
  {/* Grouped by time */}
  <section>
    <h3>Today</h3>
    {todayNotifications.map(n => <NotificationItem />)}
  </section>
  
  <section>
    <h3>This Week</h3>
    {weekNotifications.map(n => <NotificationItem />)}
  </section>
  
  <section>
    <h3>Earlier</h3>
    {olderNotifications.map(n => <NotificationItem />)}
  </section>
</div>
```

### **NotificationItem.tsx** (Individual)
```tsx
<motion.div className={isRead ? 'opacity-60' : 'bg-blue-50'}>
  {/* Avatar with type badge */}
  <div className="relative">
    <img src={senderPhotoUrl} />
    <div className="badge">
      {type === 'follow' && <UserPlus />}
      {type === 'like' && <Heart />}
      {type === 'comment' && <MessageCircle />}
    </div>
  </div>
  
  {/* Content */}
  <div>
    <p><strong>{senderName}</strong> {actionText}</p>
    <span className="time">{timeAgo}</span>
  </div>
  
  {/* Preview (if applicable) */}
  {photoUrl && <img src={photoUrl} className="preview" />}
  
  {/* Actions */}
  <div>
    {type === 'follow' && <button>Follow Back</button>}
    {type === 'like' && <button>View Post</button>}
    {type === 'comment' && <button>Reply</button>}
  </div>
</motion.div>
```

### **NotificationBadge.tsx** (Nav icon)
```tsx
<button className="relative">
  <Bell />
  {unreadCount > 0 && (
    <motion.span 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 bg-red-500 text-white"
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </motion.span>
  )}
</button>
```

---

## 🔄 Integration Points

### **1. Follow Action**
```typescript
// In FollowService.followUser()
await followService.followUser(senderId, recipientId);

// Trigger notification
await notificationService.createFollowNotification(
  senderId, 
  senderName, 
  senderPhoto, 
  recipientId
);
```

### **2. Like Action**
```typescript
// In ExploreService.likePost()
await exploreService.likePost(postId, userId, userName, userPhoto);

// Trigger notification (only if not own post)
if (post.userId !== userId) {
  await notificationService.createLikeNotification(
    userId, 
    userName, 
    userPhoto, 
    post.userId, 
    postId,
    post.title,
    post.photoUrls[0]
  );
}
```

### **3. Comment Action**
```typescript
// In ExploreService.addComment() (to be implemented)
const commentId = await exploreService.addComment(postId, userId, text);

// Trigger notification
await notificationService.createCommentNotification(
  userId,
  userName,
  userPhoto,
  post.userId,
  postId,
  commentId,
  text
);
```

---

## 🎬 Animation Strategy

### **Badge Entrance**
```tsx
initial={{ scale: 0, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: 'spring', bounce: 0.6 }}
```

### **Notification Item Entrance**
```tsx
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: index * 0.05 }}
```

### **Mark as Read**
```tsx
animate={{ 
  opacity: [1, 0.6],
  backgroundColor: ['rgba(59,130,246,0.1)', 'transparent']
}}
transition={{ duration: 0.3 }}
```

### **Swipe to Delete**
```tsx
drag="x"
dragConstraints={{ left: -100, right: 0 }}
onDragEnd={(e, info) => {
  if (info.offset.x < -70) {
    deleteNotification();
  }
}}
```

---

## 📊 Grouping Logic

### **Time-based Grouping**
```typescript
const groupByTime = (notifications) => {
  const now = Date.now();
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;
  const weekAgo = today - 604800000;
  
  return {
    today: notifications.filter(n => n.createdAt.seconds * 1000 >= today),
    yesterday: notifications.filter(n => {
      const time = n.createdAt.seconds * 1000;
      return time >= yesterday && time < today;
    }),
    thisWeek: notifications.filter(n => {
      const time = n.createdAt.seconds * 1000;
      return time >= weekAgo && time < yesterday;
    }),
    earlier: notifications.filter(n => n.createdAt.seconds * 1000 < weekAgo)
  };
};
```

### **Type-based Grouping (Aggregation)**
```typescript
// Group multiple likes into one notification
const groupLikes = (likes: Notification[]) => {
  const byPost = {};
  likes.forEach(like => {
    if (!byPost[like.postId]) byPost[like.postId] = [];
    byPost[like.postId].push(like);
  });
  
  return Object.entries(byPost).map(([postId, likes]) => ({
    type: 'like_group',
    postId,
    senders: likes.map(l => l.senderName),
    count: likes.length,
    latestTime: Math.max(...likes.map(l => l.createdAt.seconds))
  }));
};
```

---

## 🎨 UI Design Specs

### **Unread Indicator**
```tsx
// Blue dot next to unread notifications
{!notification.isRead && (
  <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-1/2 -left-4" />
)}
```

### **Background Colors**
```tsx
// Unread: Subtle blue background
className={`transition-colors ${
  notification.isRead 
    ? 'bg-white hover:bg-slate-50' 
    : 'bg-blue-50/50 hover:bg-blue-50'
}`}
```

### **Type Icons**
```tsx
const iconMap = {
  follow: { icon: UserPlus, color: 'bg-blue-500' },
  like: { icon: Heart, color: 'bg-red-500' },
  comment: { icon: MessageCircle, color: 'bg-green-500' },
  mention: { icon: AtSign, color: 'bg-purple-500' },
  trip_start: { icon: MapPin, color: 'bg-orange-500' },
  milestone: { icon: Award, color: 'bg-amber-500' }
};
```

---

## 🔄 Real-time Updates

### **Option 1: Polling** (Simple)
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadNotifications();
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

### **Option 2: Firestore Listeners** (Real-time)
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    }
  );
  
  return () => unsubscribe();
}, [userId]);
```

**Recommendation**: Start with Option 1 (polling), upgrade to Option 2 later.

---

## 📱 Mobile Interactions

### **Swipe to Delete**
```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: -80, right: 0 }}
  dragElastic={0.1}
  onDragEnd={(e, info) => {
    if (info.offset.x < -60) {
      // Show delete button
      setShowDelete(true);
    } else {
      // Snap back
      setShowDelete(false);
    }
  }}
>
  {/* Notification content */}
</motion.div>

{showDelete && (
  <button onClick={handleDelete}>
    <Trash2 />
  </button>
)}
```

### **Long Press for Actions**
```tsx
const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

<div
  onTouchStart={() => {
    const timer = setTimeout(() => {
      // Show action menu
      setShowActions(true);
    }, 500);
    setPressTimer(timer);
  }}
  onTouchEnd={() => {
    if (pressTimer) clearTimeout(pressTimer);
  }}
>
  {/* Notification */}
</div>
```

---

## 🎯 Implementation Phases

### **Phase 1: Core System** (Today)
1. Create Notification type definitions
2. Build NotificationService with CRUD operations
3. Create NotificationsList component
4. Create NotificationItem component
5. Integrate into JourneyHub notifications tab
6. Add unread badge to nav icon

### **Phase 2: Triggers** (Next)
1. Add notification creation to FollowService.followUser()
2. Add notification creation to ExploreService.likePost()
3. Add notification creation to ExploreService.addComment() (when implemented)
4. Test notification flow end-to-end

### **Phase 3: Advanced** (Future)
1. Notification grouping (multiple likes → one notification)
2. Real-time listeners (replace polling)
3. Push notifications (web push API)
4. Email notifications (Firebase Cloud Functions)
5. In-app notification center with filters

---

## 🎨 Design System

### **Colors**
```
Unread:     bg-blue-50/50
Read:       bg-white
Hover:      bg-slate-50
Badge:      bg-red-500 (unread count)
```

### **Spacing**
```
List padding:     px-4 py-2
Item padding:     p-4
Avatar size:      w-12 h-12
Badge size:       w-5 h-5
Gap:             gap-3
```

### **Typography**
```
Sender name:      font-bold text-slate-900
Action text:      text-slate-700
Time:            text-xs text-slate-400
Preview:         text-sm text-slate-500
```

---

## 🔔 Badge Strategy

### **Nav Icon Badge**
```tsx
// Show count up to 99
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

### **Auto-refresh Badge**
```typescript
// Update badge count when notifications change
useEffect(() => {
  const count = notifications.filter(n => !n.isRead).length;
  setUnreadCount(count);
}, [notifications]);
```

---

## 🚀 Performance Optimizations

### **Pagination**
```typescript
// Load 20 at a time
const [cursor, setCursor] = useState<string | null>(null);

const loadMore = async () => {
  const newNotifications = await notificationService.getNotifications(userId, {
    limit: 20,
    cursor: cursor
  });
  
  setNotifications(prev => [...prev, ...newNotifications]);
  setCursor(newNotifications[newNotifications.length - 1]?.id);
};
```

### **Virtual Scrolling** (Future)
```tsx
// For users with 1000+ notifications
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: notifications.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80,
});
```

---

## 🎯 Success Metrics

### **Technical**
- [ ] 0 TypeScript errors
- [ ] <200ms notification load time
- [ ] <50ms mark as read operation
- [ ] Real-time badge updates

### **User Experience**
- [ ] Clear notification types with icons
- [ ] Actionable buttons (Follow Back, View Post)
- [ ] Time-based grouping (Today, This Week)
- [ ] Smooth animations (60fps)

### **Business**
- [ ] Increased user engagement
- [ ] Faster follow-back rate
- [ ] Higher post interaction rate

---

## 🔧 Implementation Order

```
1. Create types/notification.ts               (5 min)
2. Create NotificationService.ts              (30 min)
3. Update Firestore rules                     (5 min)
4. Create Firestore indexes                   (5 min)
5. Create NotificationItem.tsx                (20 min)
6. Create NotificationsList.tsx               (30 min)
7. Integrate into JourneyHub                  (10 min)
8. Add unread badge to nav icon               (5 min)
9. Add notification triggers to actions       (20 min)
10. Test and polish                           (20 min)

Total Estimated Time: ~2.5 hours
```

---

## 🎊 Expected Result

Users will see a fully functional notification system with:
- ✅ Real-time unread count badge
- ✅ Grouped notifications by time
- ✅ Type-specific icons and colors
- ✅ Action buttons (Follow Back, View Post, Reply)
- ✅ Mark as read functionality
- ✅ Smooth animations
- ✅ Empty and loading states
- ✅ Responsive mobile layout

---

**Status**: 📋 Plan Ready
**Next Step**: Implement Phase 1 (Core System)
**Estimated Completion**: 2-3 hours
**Dependencies**: Firebase (already configured)

Let's start building! 🚀
