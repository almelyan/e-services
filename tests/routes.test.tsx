import React from 'react';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
const routes:Record<string,string>={
 '/':'نظرة عامة',
 '/requests':'طلبات الخدمات',
 '/requests?status=Pending':'طلبات الخدمات',
 '/requests/new':'إنشاء طلب جديد',
 '/requests/new?company=co1&service=issue':'الاسم المراد طباعته',
 '/requests/new?company=co1&service=replace':'سبب الطلب',
 '/requests/new?company=co1&service=status':'الحالة المطلوبة',
 '/requests/new?company=co1&service=pin':'لا يتم إدخال',
 '/requests/new?company=co1&service=topup':'قيمة الشحن',
 '/requests/new?company=co1&service=deliver':'بيانات المستلم',
 '/requests/new?company=co1&service=statement':'من تاريخ',
 '/requests/SR-2026-000125':'سجل الطلب',
 '/companies':'دليل الشركات',
 '/companies/co1':'بيانات الشركة',
 '/cards':'سجل البطاقات',
 '/cards/card1':'تفاصيل البطاقة',
 '/services':'الخدمات الإلكترونية',
 '/reports':'تقارير الخدمات',
 '/settings':'إعادة تعيين بيانات العرض',
 '/missing':'الصفحة غير موجودة',
};
for(const [route,expected] of Object.entries(routes))test(`renders ${route}`,()=>{const html=renderToString(<MemoryRouter initialEntries={[route]}><App/></MemoryRouter>);assert.ok(html.includes(expected));assert.ok(html.includes('نسخة عرض تجريبية'));assert.ok(!html.includes('undefined'));});
