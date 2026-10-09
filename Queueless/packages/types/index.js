"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryStatus = exports.DeliveryChannel = exports.SenderType = exports.ConversationStatus = exports.CallbackThreshold = exports.CallbackStatus = exports.CallbackChannel = exports.NotificationPriority = exports.AppointmentStatus = exports.NotificationPreference = exports.PriorityLevel = exports.EntryStatus = exports.QueueStatus = exports.OrganizationStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["CUSTOMER"] = "CUSTOMER";
    Role["STAFF"] = "STAFF";
    Role["BRANCH_MANAGER"] = "BRANCH_MANAGER";
    Role["ORG_ADMIN"] = "ORG_ADMIN";
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
})(Role || (exports.Role = Role = {}));
var OrganizationStatus;
(function (OrganizationStatus) {
    OrganizationStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    OrganizationStatus["ACTIVE"] = "ACTIVE";
    OrganizationStatus["REJECTED"] = "REJECTED";
    OrganizationStatus["SUSPENDED"] = "SUSPENDED";
})(OrganizationStatus || (exports.OrganizationStatus = OrganizationStatus = {}));
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["OPEN"] = "OPEN";
    QueueStatus["CLOSED"] = "CLOSED";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
var EntryStatus;
(function (EntryStatus) {
    EntryStatus["WAITING"] = "WAITING";
    EntryStatus["CALLING"] = "CALLING";
    EntryStatus["SERVING"] = "SERVING";
    EntryStatus["COMPLETED"] = "COMPLETED";
    EntryStatus["SKIPPED"] = "SKIPPED";
    EntryStatus["CANCELLED"] = "CANCELLED";
    EntryStatus["ABSENT"] = "ABSENT";
})(EntryStatus || (exports.EntryStatus = EntryStatus = {}));
var PriorityLevel;
(function (PriorityLevel) {
    PriorityLevel["NORMAL"] = "NORMAL";
    PriorityLevel["PRIORITY"] = "PRIORITY";
    PriorityLevel["APPOINTMENT"] = "APPOINTMENT";
})(PriorityLevel || (exports.PriorityLevel = PriorityLevel = {}));
var NotificationPreference;
(function (NotificationPreference) {
    NotificationPreference["STANDARD"] = "STANDARD";
    NotificationPreference["NOTIFY_APPROACHING_5"] = "NOTIFY_APPROACHING_5";
    NotificationPreference["NOTIFY_APPROACHING_2"] = "NOTIFY_APPROACHING_2";
    NotificationPreference["NOTIFY_CALLED_ONLY"] = "NOTIFY_CALLED_ONLY";
})(NotificationPreference || (exports.NotificationPreference = NotificationPreference = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["APPROVED"] = "APPROVED";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    AppointmentStatus["PAID"] = "PAID";
    AppointmentStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["REJECTED"] = "REJECTED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["NORMAL"] = "NORMAL";
    NotificationPriority["IMPORTANT"] = "IMPORTANT";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var CallbackChannel;
(function (CallbackChannel) {
    CallbackChannel["IN_APP_NOTIFICATION"] = "IN_APP_NOTIFICATION";
    CallbackChannel["PUSH_NOTIFICATION"] = "PUSH_NOTIFICATION";
    CallbackChannel["SMS"] = "SMS";
    CallbackChannel["WHATSAPP"] = "WHATSAPP";
    CallbackChannel["PHONE_CALL"] = "PHONE_CALL";
})(CallbackChannel || (exports.CallbackChannel = CallbackChannel = {}));
var CallbackStatus;
(function (CallbackStatus) {
    CallbackStatus["ACTIVE"] = "ACTIVE";
    CallbackStatus["TRIGGERED"] = "TRIGGERED";
    CallbackStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    CallbackStatus["CANCELLED"] = "CANCELLED";
    CallbackStatus["EXPIRED"] = "EXPIRED";
})(CallbackStatus || (exports.CallbackStatus = CallbackStatus = {}));
var CallbackThreshold;
(function (CallbackThreshold) {
    CallbackThreshold["APPROACHING_5"] = "APPROACHING_5";
    CallbackThreshold["APPROACHING_2"] = "APPROACHING_2";
    CallbackThreshold["CALLED"] = "CALLED";
})(CallbackThreshold || (exports.CallbackThreshold = CallbackThreshold = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["OPEN"] = "OPEN";
    ConversationStatus["RESOLVED"] = "RESOLVED";
    ConversationStatus["CLOSED"] = "CLOSED";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var SenderType;
(function (SenderType) {
    SenderType["CUSTOMER"] = "CUSTOMER";
    SenderType["STAFF"] = "STAFF";
    SenderType["SYSTEM"] = "SYSTEM";
})(SenderType || (exports.SenderType = SenderType = {}));
var DeliveryChannel;
(function (DeliveryChannel) {
    DeliveryChannel["IN_APP"] = "IN_APP";
    DeliveryChannel["PUSH"] = "PUSH";
    DeliveryChannel["SMS"] = "SMS";
    DeliveryChannel["EMAIL"] = "EMAIL";
    DeliveryChannel["WHATSAPP"] = "WHATSAPP";
    DeliveryChannel["VOICE"] = "VOICE";
})(DeliveryChannel || (exports.DeliveryChannel = DeliveryChannel = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "PENDING";
    DeliveryStatus["SENT"] = "SENT";
    DeliveryStatus["DELIVERED"] = "DELIVERED";
    DeliveryStatus["FAILED"] = "FAILED";
    DeliveryStatus["OPENED"] = "OPENED";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
