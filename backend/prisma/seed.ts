import 'dotenv/config';
import {
  PrismaClient, Role, StaffRole, RateSession, PaymentMode,
  ScheduleFrequency, ScheduleType, NotificationChannel, NotificationStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function jitter(base: number, pct = 0.2) {
  return +(base * (1 + (Math.random() - 0.5) * pct)).toFixed(2);
}

async function main() {
  console.log('Seeding database…');

  // ─── Organization ─────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-1' },
    update: {},
    create: {
      id: 'seed-org-1',
      name: 'Ahmed Dairy Business',
      address: 'Main Ravi Road, Lahore, Pakistan',
      phone: '042-35761234',
      email: 'info@ahmeddairy.pk',
    },
  });

  // ─── Users ────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@milkflow.test' },
    update: {},
    create: {
      id: 'seed-user-admin',
      name: 'Tariq Ahmed (Admin)',
      email: 'admin@milkflow.test',
      passwordHash: hash,
      role: Role.ADMIN,
      organizationId: org.id,
    },
  });
  await prisma.user.upsert({
    where: { email: 'manager@milkflow.test' },
    update: {},
    create: {
      id: 'seed-user-manager',
      name: 'Bilal Hussain (Manager)',
      email: 'manager@milkflow.test',
      passwordHash: hash,
      role: Role.MANAGER,
      organizationId: org.id,
    },
  });

  // ─── Organization Settings ────────────────────────────────────────────────
  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      brandName: 'Ahmed Dairy Business',
      tagline: 'Pure Milk, Trusted Since 1995',
      primaryColor: '#1d4ed8',
      accentColor: '#15803d',
      invoiceHeader: 'Ahmed Dairy Business\nMain Ravi Road, Lahore, Pakistan\nPhone: 042-35761234 | Email: info@ahmeddairy.pk',
      invoiceFooter: 'Thank you for your business. Payment due within 7 days.',
      signatureName: 'Tariq Ahmed',
      signatureTitle: 'Proprietor',
      address: 'Main Ravi Road, Lahore, Pakistan',
      phone: '042-35761234',
      email: 'info@ahmeddairy.pk',
      bankName: 'HBL',
      bankAccount: '1234-5678-90',
    },
  });

  // ─── Farmers (15) ─────────────────────────────────────────────────────────
  const FARMERS = [
    { id: 'f1', name: 'Muhammad Akram', phone: '0300-1234567', maunds: 10, rate: 8000 },
    { id: 'f2', name: 'Allah Rakha', phone: '0301-2345678', maunds: 8, rate: 8200 },
    { id: 'f3', name: 'Ghulam Rasool', phone: '0302-3456789', maunds: 12, rate: 7800 },
    { id: 'f4', name: 'Noor Muhammad', phone: '0303-4567890', maunds: 6, rate: 8500 },
    { id: 'f5', name: 'Abdul Rauf', phone: '0304-5678901', maunds: 15, rate: 7600 },
    { id: 'f6', name: 'Muhammad Rafique', phone: '0305-6789012', maunds: 9, rate: 8100 },
    { id: 'f7', name: 'Haji Basheer', phone: '0306-7890123', maunds: 20, rate: 7500 },
    { id: 'f8', name: 'Zulfiqar Ali', phone: '0307-8901234', maunds: 5, rate: 8800 },
    { id: 'f9', name: 'Sardar Khan', phone: '0308-9012345', maunds: 11, rate: 7900 },
    { id: 'f10', name: 'Manzoor Ahmad', phone: '0309-0123456', maunds: 7, rate: 8300 },
    { id: 'f11', name: 'Pervez Akhtar', phone: '0310-1234568', maunds: 14, rate: 7700 },
    { id: 'f12', name: 'Muhammad Ijaz', phone: '0311-2345679', maunds: 8, rate: 8150 },
    { id: 'f13', name: 'Hafiz Saleem', phone: '0312-3456780', maunds: 10, rate: 8050 },
    { id: 'f14', name: 'Naseer Ahmad', phone: '0313-4567891', maunds: 18, rate: 7650 },
    { id: 'f15', name: 'Khalid Mehmood', phone: '0314-5678902', maunds: 6, rate: 8600 },
  ];

  const farmerIds: string[] = [];
  for (const f of FARMERS) {
    const rec = await prisma.farmer.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        name: f.name,
        phone: f.phone,
        contractedMaunds: f.maunds,
        fixedRatePerMaund: f.rate,
        contractStart: new Date('2026-01-01'),
        contractEnd: new Date('2026-12-31'),
        organizationId: org.id,
      },
    });
    farmerIds.push(rec.id);
  }

  // ─── Retailers (12) ───────────────────────────────────────────────────────
  const RETAILERS = [
    { id: 'r1', name: 'Hassan Milk Shop', phone: '0321-9876543', maunds: 4, rate: 10000 },
    { id: 'r2', name: 'Al-Madina Dairy', phone: '0322-8765432', maunds: 6, rate: 9800 },
    { id: 'r3', name: 'Green Valley Milk', phone: '0323-7654321', maunds: 5, rate: 10200 },
    { id: 'r4', name: 'Bismillah Dairy', phone: '0324-6543210', maunds: 8, rate: 9600 },
    { id: 'r5', name: 'Punjab Milk Centre', phone: '0325-5432109', maunds: 10, rate: 9500 },
    { id: 'r6', name: 'Raza Milk Store', phone: '0326-4321098', maunds: 3, rate: 10500 },
    { id: 'r7', name: 'City Dairy Point', phone: '0327-3210987', maunds: 7, rate: 9700 },
    { id: 'r8', name: 'Al-Barakat Milk', phone: '0328-2109876', maunds: 5, rate: 10100 },
    { id: 'r9', name: 'Fatima Milk Shop', phone: '0329-1098765', maunds: 4, rate: 10300 },
    { id: 'r10', name: 'National Dairy', phone: '0330-0987654', maunds: 12, rate: 9400 },
    { id: 'r11', name: 'Anwar Milk Centre', phone: '0331-9876540', maunds: 6, rate: 9900 },
    { id: 'r12', name: 'Shafiq Dairy Shop', phone: '0332-8765431', maunds: 3, rate: 10600 },
  ];

  const retailerIds: string[] = [];
  for (const r of RETAILERS) {
    const rec = await prisma.retailer.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name,
        phone: r.phone,
        committedMaunds: r.maunds,
        fixedRatePerMaund: r.rate,
        organizationId: org.id,
      },
    });
    retailerIds.push(rec.id);
  }

  // ─── Staff (8) ────────────────────────────────────────────────────────────
  const STAFF = [
    { id: 'st1', name: 'Rizwan Ahmad', role: StaffRole.DRIVER, salary: 35000, nic: '3520112345678', phone: '0300-1111111' },
    { id: 'st2', name: 'Imran Butt', role: StaffRole.DRIVER, salary: 32000, nic: '3520112345679', phone: '0301-2222222' },
    { id: 'st3', name: 'Shahid Ali', role: StaffRole.HELPER, salary: 22000, nic: '3520112345680', phone: '0302-3333333' },
    { id: 'st4', name: 'Asif Raza', role: StaffRole.HELPER, salary: 20000, nic: '3520112345681', phone: '0303-4444444' },
    { id: 'st5', name: 'Jameel Khan', role: StaffRole.HELPER, salary: 21000, nic: '3520112345682', phone: '0304-5555555' },
    { id: 'st6', name: 'Naeem Hassan', role: StaffRole.DRIVER, salary: 33000, nic: '3520112345683', phone: '0305-6666666' },
    { id: 'st7', name: 'Umer Farooq', role: StaffRole.HELPER, salary: 19000, nic: '3520112345684', phone: '0306-7777777' },
    { id: 'st8', name: 'Waseem Akhtar', role: StaffRole.HELPER, salary: 20500, nic: '3520112345685', phone: '0307-8888888' },
  ];

  for (const s of STAFF) {
    await prisma.staff.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        role: s.role,
        salary: s.salary,
        nic: s.nic,
        phone: s.phone,
        joinDate: new Date('2025-01-01'),
        organizationId: org.id,
      },
    });
  }

  // ─── Market Rates (60 days × 2 sessions = 120) ────────────────────────────
  console.log('Seeding market rates…');
  const morningRates: number[] = [];
  const eveningRates: number[] = [];
  for (let d = 59; d >= 0; d--) {
    const date = daysAgo(d);
    const mr = jitter(9000, 0.15);
    const er = jitter(9200, 0.15);
    morningRates.push(mr);
    eveningRates.push(er);
    await prisma.marketRate.upsert({
      where: { date_session_organizationId: { date, session: RateSession.MORNING, organizationId: org.id } },
      update: { ratePerMaund: mr },
      create: { date, session: RateSession.MORNING, ratePerMaund: mr, organizationId: org.id },
    });
    await prisma.marketRate.upsert({
      where: { date_session_organizationId: { date, session: RateSession.EVENING, organizationId: org.id } },
      update: { ratePerMaund: er },
      create: { date, session: RateSession.EVENING, ratePerMaund: er, organizationId: org.id },
    });
  }

  // ─── Collection + Delivery entries (60 days) ──────────────────────────────
  console.log('Seeding collection and delivery entries…');

  const farmerObjs = FARMERS;
  const retailerObjs = RETAILERS;

  for (let d = 59; d >= 0; d--) {
    const date = daysAgo(d);
    const mr = morningRates[59 - d];
    const er = eveningRates[59 - d];

    // Collections — all farmers, both sessions
    for (const f of farmerObjs) {
      const skipMorning = Math.random() < 0.05; // 5% chance farmer skips
      const skipEvening = Math.random() < 0.08;

      if (!skipMorning) {
        const muns = jitter(f.maunds * 0.5, 0.3);
        await prisma.collectionEntry.create({
          data: {
            date,
            session: RateSession.MORNING,
            farmerId: f.id,
            collectedMaunds: muns,
            qualityFatPercent: jitter(4.5, 0.2),
            qualityWaterAdded: Math.random() < 0.03,
            qualityDensity: jitter(1.028, 0.01),
            qualityPassed: Math.random() < 0.97,
            organizationId: org.id,
          },
        });
      }

      if (!skipEvening) {
        const muns = jitter(f.maunds * 0.5, 0.3);
        await prisma.collectionEntry.create({
          data: {
            date,
            session: RateSession.EVENING,
            farmerId: f.id,
            collectedMaunds: muns,
            qualityFatPercent: jitter(4.3, 0.2),
            qualityWaterAdded: Math.random() < 0.03,
            qualityDensity: jitter(1.027, 0.01),
            qualityPassed: Math.random() < 0.96,
            organizationId: org.id,
          },
        });
      }
    }

    // Deliveries — all retailers, both sessions
    for (const r of retailerObjs) {
      const skipMorning = Math.random() < 0.05;
      const skipEvening = Math.random() < 0.08;

      if (!skipMorning) {
        const muns = jitter(r.maunds * 0.5, 0.25);
        await prisma.deliveryEntry.create({
          data: {
            date,
            session: RateSession.MORNING,
            retailerId: r.id,
            deliveredMaunds: muns,
            organizationId: org.id,
          },
        });
      }

      if (!skipEvening) {
        const muns = jitter(r.maunds * 0.5, 0.25);
        await prisma.deliveryEntry.create({
          data: {
            date,
            session: RateSession.EVENING,
            retailerId: r.id,
            deliveredMaunds: muns,
            organizationId: org.id,
          },
        });
      }
    }

    // ─── Farmer Invoices ───────────────────────────────────────────────────
    const avgRate = (mr + er) / 2;
    for (const f of farmerObjs) {
      const entries = await prisma.collectionEntry.findMany({
        where: { farmerId: f.id, organizationId: org.id, date },
      });
      const supplied = entries.reduce((s, e) => s + Number(e.collectedMaunds), 0);
      const contracted = f.maunds;
      const fixedRate = f.rate;
      let base = 0, penalty = 0, bonus = 0;
      if (supplied <= contracted) {
        base = supplied * fixedRate;
        penalty = (contracted - supplied) * avgRate;
      } else {
        base = contracted * fixedRate;
        bonus = (supplied - contracted) * avgRate;
      }
      const net = base - penalty + bonus;
      const isPaid = d > 3; // last 3 days unpaid
      const payMode = isPaid ? pick([PaymentMode.CASH, PaymentMode.CHEQUE, PaymentMode.BANK_TRANSFER]) : null;

      await prisma.farmerInvoice.create({
        data: {
          farmerId: f.id,
          organizationId: org.id,
          date,
          contractedMaunds: contracted,
          suppliedMaunds: supplied,
          fixedRate,
          marketRate: avgRate,
          baseAmount: base,
          shortfallPenalty: penalty,
          excessBonus: bonus,
          netAmount: net,
          isPaid,
          paidAt: isPaid ? daysAgo(d - 1) : null,
          paymentMode: payMode,
          paymentReference: payMode === PaymentMode.CHEQUE ? `CHQ-${Math.floor(Math.random() * 900000 + 100000)}` : null,
        },
      });
    }

    // ─── Retailer Invoices ─────────────────────────────────────────────────
    for (const r of retailerObjs) {
      const entries = await prisma.deliveryEntry.findMany({
        where: { retailerId: r.id, organizationId: org.id, date },
      });
      const purchased = entries.reduce((s, e) => s + Number(e.deliveredMaunds), 0);
      const committed = r.maunds;
      const fixedRate = r.rate;
      let base = 0, surcharge = 0;
      if (purchased <= committed) {
        base = purchased * fixedRate;
      } else {
        base = committed * fixedRate;
        surcharge = (purchased - committed) * (avgRate + 300);
      }
      const net = base + surcharge;
      const isPaid = d > 3;
      const payMode = isPaid ? pick([PaymentMode.CASH, PaymentMode.CHEQUE, PaymentMode.BANK_TRANSFER, PaymentMode.ONLINE]) : null;

      await prisma.retailerInvoice.create({
        data: {
          retailerId: r.id,
          organizationId: org.id,
          date,
          committedMaunds: committed,
          purchasedMaunds: purchased,
          fixedRate,
          marketRate: avgRate,
          baseAmount: base,
          excessSurcharge: surcharge,
          netAmount: net,
          isPaid,
          paidAt: isPaid ? daysAgo(d - 1) : null,
          paymentMode: payMode,
        },
      });
    }
  }

  // ─── Notification Schedules (sample) ──────────────────────────────────────
  const schedules = [
    {
      name: 'Daily Farmer Invoice Summary',
      type: ScheduleType.FARMER_INVOICE,
      frequency: ScheduleFrequency.DAILY,
      hour: 20, minute: 0,
      channels: ['WHATSAPP', 'EMAIL'],
      recipientType: 'ALL_FARMERS',
    },
    {
      name: 'Daily Retailer Invoice Summary',
      type: ScheduleType.RETAILER_INVOICE,
      frequency: ScheduleFrequency.DAILY,
      hour: 21, minute: 0,
      channels: ['EMAIL'],
      recipientType: 'ALL_RETAILERS',
    },
    {
      name: 'Weekly Balance Report',
      type: ScheduleType.BALANCE_REPORT,
      frequency: ScheduleFrequency.WEEKLY,
      dayOfWeek: 1, // Monday
      hour: 9, minute: 0,
      channels: ['EMAIL'],
      recipientType: 'ADMIN',
    },
    {
      name: 'Monthly P&L Report',
      type: ScheduleType.PROFIT_LOSS,
      frequency: ScheduleFrequency.MONTHLY,
      dayOfMonth: 1,
      hour: 8, minute: 0,
      channels: ['EMAIL'],
      recipientType: 'ADMIN',
    },
  ];

  for (const s of schedules) {
    await prisma.notificationSchedule.create({
      data: {
        name: s.name,
        type: s.type,
        frequency: s.frequency,
        dayOfWeek: s.dayOfWeek ?? null,
        dayOfMonth: s.dayOfMonth ?? null,
        hour: s.hour,
        minute: s.minute,
        channels: s.channels,
        recipientType: s.recipientType,
        organizationId: org.id,
      },
    });
  }

  // ─── Subscription ─────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { id: 'seed-sub-1' },
    update: {},
    create: {
      id: 'seed-sub-1',
      organizationId: org.id,
      plan: 'STANDARD',
      status: 'ACTIVE',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      amountPaid: 5000,
      features: {
        collection: true, delivery: true, billing: true,
        reports: true, accounts: true, transport: true, staff: true,
        multiUser: false, maxFarmers: 50, maxRetailers: 50, durationDays: 30,
        price: 5000, label: 'Standard Plan',
      },
    },
  });

  // ─── Notifications (20) ───────────────────────────────────────────────────
  type NotifSeed = {
    farmerId?: string; retailerId?: string;
    channel: NotificationChannel; subject: string; message: string;
    status: NotificationStatus; isRead: boolean; daysAgo: number;
  };
  const notifData: NotifSeed[] = [
    { farmerId: 'f1',  channel: NotificationChannel.WHATSAPP, subject: 'Milk Collection Receipt',      message: 'Dear Muhammad Ali, your morning collection of 10.2 maunds has been recorded. Amount: Rs.81,600. Thank you.', status: NotificationStatus.SENT,    isRead: true,  daysAgo: 1 },
    { farmerId: 'f2',  channel: NotificationChannel.EMAIL,    subject: 'Daily Milk Summary',            message: 'Dear Abdullah Khan, your daily milk collection report for yesterday: Morning 9.8 maunds, Evening 10.1 maunds. Total: Rs.159,920.', status: NotificationStatus.SENT, isRead: true, daysAgo: 1 },
    { retailerId: 'r1', channel: NotificationChannel.WHATSAPP, subject: 'Invoice Generated',           message: 'Dear Hassan Milk Shop, your invoice for today has been generated. Amount due: Rs.40,000 for 4 maunds. Please pay within 3 days.', status: NotificationStatus.SENT, isRead: false, daysAgo: 0 },
    { retailerId: 'r2', channel: NotificationChannel.SMS,      subject: 'Payment Reminder',            message: 'Al-Madina Dairy: You have an outstanding balance of Rs.58,800. Please clear your dues at your earliest convenience.', status: NotificationStatus.SENT, isRead: false, daysAgo: 0 },
    { farmerId: 'f3',  channel: NotificationChannel.SMS,       subject: 'Shortfall Penalty Notice',    message: 'Dear Ahmed Raza, you supplied 7 maunds against your committed 10 maunds today. A penalty of Rs.9,000 has been applied.', status: NotificationStatus.SENT, isRead: false, daysAgo: 0 },
    { farmerId: 'f4',  channel: NotificationChannel.EMAIL,     subject: 'Excess Supply Bonus',         message: 'Dear Bashir Ahmad, you supplied 13 maunds against your committed 10 maunds. Excess of 3 maunds paid at market rate Rs.9,200/maund. Bonus: Rs.27,600.', status: NotificationStatus.SENT, isRead: true, daysAgo: 2 },
    { retailerId: 'r3', channel: NotificationChannel.WHATSAPP, subject: 'Weekly Summary',             message: 'Green Valley Milk: This week you purchased 35 maunds. Total billed: Rs.357,000. Outstanding: Rs.0. Thank you for prompt payment!', status: NotificationStatus.SENT, isRead: true, daysAgo: 3 },
    { farmerId: 'f5',  channel: NotificationChannel.WHATSAPP, subject: 'Quality Test Results',        message: 'Dear Khalid Hussain, today\'s milk quality test passed. Fat: 4.2%, Water: 0%, Density: 1.028 g/ml. Excellent quality!', status: NotificationStatus.SENT, isRead: true, daysAgo: 2 },
    { retailerId: 'r4', channel: NotificationChannel.EMAIL,   subject: 'Monthly Invoice Summary',     message: 'Dear Noor Dairy, your monthly invoice summary is ready. Total purchases: 124 maunds. Total billed: Rs.1,364,000. Please review attached PDF.', status: NotificationStatus.SENT, isRead: false, daysAgo: 1 },
    { farmerId: 'f6',  channel: NotificationChannel.SMS,      subject: 'Collection Reminder',         message: 'Imran Shah: Tomorrow morning collection is scheduled at 6:00 AM. Please ensure your milk is ready.', status: NotificationStatus.SENT, isRead: true, daysAgo: 0 },
    { farmerId: 'f1',  channel: NotificationChannel.EMAIL,    subject: 'Contract Renewal Reminder',   message: 'Dear Muhammad Ali, your milk supply contract expires on 31 Dec 2026. Please contact our office to renew. Current rate: Rs.8,000/maund.', status: NotificationStatus.PENDING, isRead: false, daysAgo: 0 },
    { retailerId: 'r5', channel: NotificationChannel.WHATSAPP, subject: 'Rate Change Notice',         message: 'City Fresh Milk: Please note that the market rate has been updated for today evening session. New rate: Rs.9,400/maund.', status: NotificationStatus.SENT, isRead: false, daysAgo: 0 },
    { farmerId: 'f7',  channel: NotificationChannel.WHATSAPP, subject: 'Evening Collection Confirmed', message: 'Dear Tariq Mehmood, your evening collection of 12 maunds received in good condition. Amount: Rs.97,600. Tanks returned.', status: NotificationStatus.SENT, isRead: true, daysAgo: 1 },
    { retailerId: 'r6', channel: NotificationChannel.SMS,     subject: 'Delivery Confirmation',       message: 'Pak Fresh Dairy: Your delivery of 8 maunds has been completed. Vehicle KHI-1234 arrived at 7:15 AM. Please confirm receipt.', status: NotificationStatus.FAILED, isRead: false, daysAgo: 1 },
    { farmerId: 'f8',  channel: NotificationChannel.EMAIL,    subject: 'Payment Processed',           message: 'Dear Liaquat Ali, your payment of Rs.240,000 for the week ending 10 May has been processed via bank transfer. Reference: TXN-20260510-001.', status: NotificationStatus.SENT, isRead: true, daysAgo: 2 },
    { retailerId: 'r7', channel: NotificationChannel.WHATSAPP, subject: 'Unpaid Invoice Alert',       message: 'Silver Spoon Dairy: Invoice #INV-2026-0412 for Rs.102,000 is now 7 days overdue. Please clear payment to avoid service interruption.', status: NotificationStatus.SENT, isRead: false, daysAgo: 3 },
    { farmerId: 'f9',  channel: NotificationChannel.SMS,      subject: 'Tank Return Notice',          message: 'Farhan Malik: 5 tanks from yesterday collection are still pending return. Please return them by tomorrow morning.', status: NotificationStatus.SENT, isRead: true, daysAgo: 1 },
    { retailerId: 'r8', channel: NotificationChannel.EMAIL,   subject: 'Excess Purchase Surcharge',   message: 'Dear Zubair Store, you purchased 7 maunds against your committed 4 maunds. Excess 3 maunds charged at market rate Rs.9,200 + Rs.300 surcharge = Rs.28,500 extra.', status: NotificationStatus.SENT, isRead: false, daysAgo: 0 },
    { farmerId: 'f10', channel: NotificationChannel.WHATSAPP, subject: 'Quality Fail - Action Needed', message: 'Dear Sajid Iqbal, today morning sample failed quality check. Water content detected: 8%. This batch has been rejected. Please contact us immediately.', status: NotificationStatus.SENT, isRead: false, daysAgo: 0 },
    { retailerId: 'r9', channel: NotificationChannel.WHATSAPP, subject: 'Good Morning - Rate Update', message: 'Sunrise Dairy: Today morning session market rate is Rs.9,100/maund. Your fixed contract rate remains Rs.10,400/maund. Have a great day!', status: NotificationStatus.SENT, isRead: true, daysAgo: 1 },
  ];

  for (const n of notifData) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - n.daysAgo);
    await prisma.notification.create({
      data: {
        farmerId: n.farmerId,
        retailerId: n.retailerId,
        channel: n.channel,
        subject: n.subject,
        message: n.message,
        status: n.status,
        isRead: n.isRead,
        organizationId: org.id,
        createdAt,
        sentAt: n.status === NotificationStatus.SENT ? createdAt : undefined,
      },
    });
  }

  const counts = {
    farmers: await prisma.farmer.count({ where: { organizationId: org.id } }),
    retailers: await prisma.retailer.count({ where: { organizationId: org.id } }),
    staff: await prisma.staff.count({ where: { organizationId: org.id } }),
    marketRates: await prisma.marketRate.count({ where: { organizationId: org.id } }),
    collection: await prisma.collectionEntry.count({ where: { organizationId: org.id } }),
    delivery: await prisma.deliveryEntry.count({ where: { organizationId: org.id } }),
    farmerInvoices: await prisma.farmerInvoice.count({ where: { organizationId: org.id } }),
    retailerInvoices: await prisma.retailerInvoice.count({ where: { organizationId: org.id } }),
    schedules: await prisma.notificationSchedule.count({ where: { organizationId: org.id } }),
    notifications: await prisma.notification.count({ where: { organizationId: org.id } }),
  };

  console.log('\n✅ Seed complete!');
  console.log('Login: admin@milkflow.test / password123');
  console.log('Records created:', counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
