import { prisma } from './lib/prisma';
import { syncEmployeePayslips } from './app/(authenticated)/rh/actions';

async function test() {
    const employees = await prisma.user.findMany({ select: { id: true, name: true }});
    const c = employees.find(e => e.name.toLowerCase().includes('souchet'));
    if (c) {
        console.log("Testing sync for", c.name);
        const res = await syncEmployeePayslips(c.id);
        console.log(res);
    }
}
test().catch(console.error).finally(() => process.exit(0));
