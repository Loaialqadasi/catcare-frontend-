// Tests for the raw → typed normalizers.
// These are the contract between the backend wire format and the frontend
// domain models — a regression here cascades into every screen.

import { describe, it, expect } from 'vitest';
import {
  normalizeCat,
  normalizeCareHistory,
  normalizeDonation,
  normalizeEmergency,
  normalizeUser,
  normalizeVolunteer,
} from '@/lib/api/normalizers';
import type {
  RawCat,
  RawCareHistory,
  RawDonation,
  RawEmergency,
  RawUser,
  RawVolunteer,
} from '@/lib/api/types';

describe('normalizeUser', () => {
  it('converts numeric id to string', () => {
    const raw: RawUser = {
      id: 42,
      fullName: 'Layth Amgad',
      email: 'layth@utm.my',
      role: 'admin',
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    };
    const user = normalizeUser(raw);
    expect(user.id).toBe('42');
    expect(user.email).toBe('layth@utm.my');
    expect(user.role).toBe('admin');
  });
});

describe('normalizeCat', () => {
  it('preserves null lat/lng and converts numeric id', () => {
    const raw: RawCat = {
      id: 7,
      nickname: 'Milo',
      description: null,
      photoUrl: null,
      locationName: 'Library',
      latitude: null,
      longitude: null,
      healthStatus: 'healthy',
      ownershipTag: 'stray',
      createdByUserId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    };
    const cat = normalizeCat(raw);
    expect(cat.id).toBe('7');
    expect(cat.latitude).toBeNull();
    expect(cat.longitude).toBeNull();
    expect(cat.createdByUserId).toBeNull();
  });

  it('parses latitude/longitude as numbers (not strings)', () => {
    const raw: RawCat = {
      id: 1,
      nickname: 'Luna',
      description: 'calico',
      photoUrl: 'https://example.com/luna.jpg',
      locationName: 'Kolej 9',
      latitude: 1.5341,
      longitude: 103.6548,
      healthStatus: 'injured',
      ownershipTag: 'campus_managed',
      createdByUserId: 5,
      createdAt: '',
      updatedAt: '',
    };
    const cat = normalizeCat(raw);
    expect(cat.latitude).toBeCloseTo(1.5341, 5);
    expect(cat.longitude).toBeCloseTo(103.6548, 5);
    expect(typeof cat.latitude).toBe('number');
    expect(typeof cat.longitude).toBe('number');
    expect(cat.createdByUserId).toBe('5');
  });
});

describe('normalizeEmergency', () => {
  it('maps cat subobject when present, preserves null', () => {
    const rawWithCat: RawEmergency = {
      id: 10,
      catId: 5,
      title: 'Injured paw',
      description: 'Cat limping near library',
      emergencyType: 'injury',
      priority: 'high',
      status: 'open',
      locationName: 'Library',
      latitude: 1.5,
      longitude: 103.6,
      reportedByUserId: 3,
      createdAt: '',
      updatedAt: '',
      resolvedAt: null,
      cat: { id: 5, nickname: 'Milo' },
    };
    const e = normalizeEmergency(rawWithCat);
    expect(e.cat).toEqual({ id: '5', nickname: 'Milo' });
    expect(e.catId).toBe('5');

    const rawNoCat: RawEmergency = { ...rawWithCat, cat: null, catId: null };
    const e2 = normalizeEmergency(rawNoCat);
    expect(e2.cat).toBeNull();
    expect(e2.catId).toBeNull();
  });
});

describe('normalizeDonation', () => {
  it('coerces amount to Number, preserves optional reviewer fields', () => {
    const raw: RawDonation = {
      id: 99,
      donorName: 'Alice',
      donorEmail: 'alice@example.com',
      amount: 50,
      receiptUrl: null,
      note: 'For vet bills',
      status: 'pending',
      rejectionReason: null,
      donorUserId: 1,
      reviewedByUserId: null,
      reviewedAt: null,
      createdAt: '',
      updatedAt: '',
    };
    const d = normalizeDonation(raw);
    expect(d.id).toBe('99');
    expect(d.amount).toBe(50);
    expect(typeof d.amount).toBe('number');
    expect(d.donorUserId).toBe('1');
    expect(d.reviewedByUserId).toBeNull();
  });
});

describe('normalizeCareHistory', () => {
  it('stringifies ids', () => {
    const raw: RawCareHistory = {
      id: 3,
      catId: 7,
      careType: 'feeding',
      description: 'Morning feed',
      performedBy: 'Loai',
      performedByUserId: 2,
      createdAt: '2024-05-01T00:00:00.000Z',
    };
    const c = normalizeCareHistory(raw);
    expect(c.id).toBe('3');
    expect(c.catId).toBe('7');
    expect(c.performedByUserId).toBe('2');
  });
});

describe('normalizeVolunteer', () => {
  it('coerces age to number, maps null userId', () => {
    const raw: RawVolunteer = {
      id: 1,
      studentName: 'Bob',
      studentId: 'A21EC0001',
      age: 21,
      faculty: 'FC',
      interests: 'Feeding',
      userId: null,
      status: 'pending',
      createdAt: '',
      updatedAt: '',
    };
    const v = normalizeVolunteer(raw);
    expect(v.id).toBe('1');
    expect(v.age).toBe(21);
    expect(typeof v.age).toBe('number');
    expect(v.userId).toBeNull();
    expect(v.status).toBe('pending');
  });
});
