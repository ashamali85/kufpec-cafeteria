import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // App settings (single row).
  await prisma.appSetting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      negativeLimitFils: 5000, // -5.000 KWD
      allowedEmailDomains: 'kufpec.com',
      cafeteriaName: 'KUFPEC Cafeteria'
    }
  });

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // Staff.
  await prisma.user.upsert({
    where: { email: 'superadmin@kufpec.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@kufpec.com',
      passwordHash: await hash('Admin@12345'),
      role: UserRole.SUPER_ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: 'cafeteria@kufpec.com' },
    update: {},
    create: {
      name: 'Cafeteria Desk',
      email: 'cafeteria@kufpec.com',
      passwordHash: await hash('Cafe@12345'),
      role: UserRole.CAFETERIA_ADMIN
    }
  });

  // Sample employees with starting credit.
  const employees = [
    { name: 'Sara Al-Otaibi', email: 'sara@kufpec.com', office: '1204', floor: '12', balance: 10000 },
    { name: 'Khaled Al-Rashidi', email: 'khaled@kufpec.com', office: '0815', floor: '8', balance: 3000 }
  ];
  for (const e of employees) {
    await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        name: e.name,
        email: e.email,
        passwordHash: await hash('Employee@123'),
        role: UserRole.EMPLOYEE,
        officeNumber: e.office,
        floorNumber: e.floor,
        balanceFils: e.balance
      }
    });
  }

  // Menu.
  const menu: { category: string; order: number; items: { name: string; desc: string; price: number }[] }[] = [
    {
      category: 'Hot drinks', order: 1, items: [
        { name: 'Karak Tea', desc: 'Spiced milk tea', price: 350 },
        { name: 'Americano', desc: 'Double shot, hot water', price: 600 },
        { name: 'Cappuccino', desc: 'Espresso with steamed milk', price: 750 }
      ]
    },
    {
      category: 'Breakfast', order: 2, items: [
        { name: 'Halloumi Sandwich', desc: 'Grilled halloumi, tomato, mint', price: 1250 },
        { name: 'Foul & Bread', desc: 'Fava beans with olive oil', price: 900 },
        { name: 'Egg & Cheese Croissant', desc: 'Butter croissant, fried egg', price: 1100 }
      ]
    },
    {
      category: 'Lunch', order: 3, items: [
        { name: 'Chicken Machboos', desc: 'Spiced rice with chicken', price: 2500 },
        { name: 'Grilled Chicken Wrap', desc: 'Garlic sauce, pickles, fries', price: 1750 },
        { name: 'Mixed Grill Plate', desc: 'Kebab, tikka, rice, salad', price: 3250 }
      ]
    },
    {
      category: 'Snacks', order: 4, items: [
        { name: 'Samboosa (3 pcs)', desc: 'Crispy cheese or veg', price: 600 },
        { name: 'Fresh Orange Juice', desc: 'Cold pressed', price: 850 },
        { name: 'Date Cake Slice', desc: 'With tahini drizzle', price: 700 }
      ]
    }
  ];

  for (const cat of menu) {
    const existing = await prisma.menuCategory.findFirst({ where: { name: cat.category } });
    const category =
      existing ??
      (await prisma.menuCategory.create({ data: { name: cat.category, displayOrder: cat.order } }));

    for (let i = 0; i < cat.items.length; i++) {
      const it = cat.items[i];
      const itemExists = await prisma.menuItem.findFirst({
        where: { name: it.name, categoryId: category.id }
      });
      if (!itemExists) {
        await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: it.name,
            description: it.desc,
            priceFils: it.price,
            displayOrder: i
          }
        });
      }
    }
  }

  console.log('Seed complete.');
  console.log('Super admin:    superadmin@kufpec.com / Admin@12345');
  console.log('Cafeteria admin: cafeteria@kufpec.com / Cafe@12345');
  console.log('Employee:        sara@kufpec.com / Employee@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
