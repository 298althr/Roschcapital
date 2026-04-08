import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const top100USBanks = [
  { bankName: 'JPMorgan Chase Bank', routingNumber: '021000021', swiftCode: 'CHASUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Bank of America', routingNumber: '026009593', swiftCode: 'BOFAUS3N', bankType: 'COMMERCIAL' },
  { bankName: 'Wells Fargo Bank', routingNumber: '121000248', swiftCode: 'WFBIUS6S', bankType: 'COMMERCIAL' },
  { bankName: 'Citibank', routingNumber: '021000089', swiftCode: 'CITIUS33', bankType: 'COMMERCIAL' },
  { bankName: 'U.S. Bank', routingNumber: '091000022', swiftCode: 'USBKUS44', bankType: 'COMMERCIAL' },
  { bankName: 'PNC Bank', routingNumber: '043000096', swiftCode: 'PNCCUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Capital One', routingNumber: '065000090', swiftCode: 'NFBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'TD Bank', routingNumber: '031201360', swiftCode: 'NRTHUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Bank of the West', routingNumber: '121100782', swiftCode: 'BOWAUS66', bankType: 'COMMERCIAL' },
  { bankName: 'Fifth Third Bank', routingNumber: '042000314', swiftCode: 'FTBCUS3C', bankType: 'COMMERCIAL' },
  { bankName: 'HSBC Bank USA', routingNumber: '021001088', swiftCode: 'MRMDUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Citizens Bank', routingNumber: '011500120', swiftCode: 'CTZIUS33', bankType: 'COMMERCIAL' },
  { bankName: 'KeyBank', routingNumber: '041001039', swiftCode: 'KEYBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Truist Bank', routingNumber: '061113415', swiftCode: 'SNTRUS3A', bankType: 'COMMERCIAL' },
  { bankName: 'M&T Bank', routingNumber: '022000046', swiftCode: 'MANTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Regions Bank', routingNumber: '062000019', swiftCode: 'AMNBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'BMO Harris Bank', routingNumber: '071000288', swiftCode: 'HATRUS44', bankType: 'COMMERCIAL' },
  { bankName: 'Huntington National Bank', routingNumber: '044000024', swiftCode: 'HUNTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Ally Bank', routingNumber: '124003116', swiftCode: 'ALLYUS33', bankType: 'COMMERCIAL' },
  { bankName: 'American Express National Bank', routingNumber: '124085066', swiftCode: 'AEIBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Discover Bank', routingNumber: '031100649', swiftCode: 'DISBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Synchrony Bank', routingNumber: '031101169', swiftCode: 'SYNCUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Charles Schwab Bank', routingNumber: '121202211', swiftCode: 'SCHBUS33', bankType: 'INVESTMENT' },
  { bankName: 'Goldman Sachs Bank USA', routingNumber: '124071889', swiftCode: 'GSCMUS33', bankType: 'INVESTMENT' },
  { bankName: 'Morgan Stanley Bank', routingNumber: '124071382', swiftCode: 'MSNYUS33', bankType: 'INVESTMENT' },
  { bankName: 'Barclays Bank Delaware', routingNumber: '031101143', swiftCode: 'BARCUS33', bankType: 'COMMERCIAL' },
  { bankName: 'USAA Federal Savings Bank', routingNumber: '314074269', swiftCode: 'USAAUS44', bankType: 'COMMERCIAL' },
  { bankName: 'Navy Federal Credit Union', routingNumber: '256074974', swiftCode: 'NFCUUS33', bankType: 'CREDIT_UNION' },
  { bankName: 'State Farm Bank', routingNumber: '062203751', swiftCode: 'SFBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Santander Bank', routingNumber: '011075150', swiftCode: 'SVRNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Republic Bank', routingNumber: '321081669', swiftCode: 'FRBKUS6S', bankType: 'COMMERCIAL' },
  { bankName: 'Silicon Valley Bank', routingNumber: '121140399', swiftCode: 'SVBKUS6S', bankType: 'COMMERCIAL' },
  { bankName: 'Comerica Bank', routingNumber: '072000096', swiftCode: 'MNBDUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Zions Bancorporation', routingNumber: '124000054', swiftCode: 'ZBORUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Citizens Bank', routingNumber: '053100300', swiftCode: 'FCBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Synovus Bank', routingNumber: '061101375', swiftCode: 'SYNVUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Valley National Bank', routingNumber: '021201383', swiftCode: 'VNBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Webster Bank', routingNumber: '021101108', swiftCode: 'WBKAUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Horizon Bank', routingNumber: '084000026', swiftCode: 'FHBKUS44', bankType: 'COMMERCIAL' },
  { bankName: 'UMB Bank', routingNumber: '101000695', swiftCode: 'UMBKUS44', bankType: 'COMMERCIAL' },
  { bankName: 'BOK Financial', routingNumber: '103000648', swiftCode: 'BOKFUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Frost Bank', routingNumber: '114000093', swiftCode: 'FRSTUS44', bankType: 'COMMERCIAL' },
  { bankName: 'Hancock Whitney Bank', routingNumber: '065403626', swiftCode: 'HWBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First National Bank of Omaha', routingNumber: '104000016', swiftCode: 'FNBOUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Pinnacle Bank', routingNumber: '064008637', swiftCode: 'PINNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Texas Capital Bank', routingNumber: '113122655', swiftCode: 'TCBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'BankUnited', routingNumber: '067014822', swiftCode: 'BKUNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Flagstar Bank', routingNumber: '272471852', swiftCode: 'FLGBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Investors Bank', routingNumber: '021201503', swiftCode: 'INVBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'People\'s United Bank', routingNumber: '211170101', swiftCode: 'PEUPUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Associated Bank', routingNumber: '075000019', swiftCode: 'ASSOBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Old National Bank', routingNumber: '086000004', swiftCode: 'OLDNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Simmons Bank', routingNumber: '082900872', swiftCode: 'SIMMUS33', bankType: 'COMMERCIAL' },
  { bankName: 'South State Bank', routingNumber: '053207766', swiftCode: 'SOSTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Prosperity Bank', routingNumber: '113122655', swiftCode: 'PROSUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Cullen/Frost Bankers', routingNumber: '114000093', swiftCode: 'CULFUS44', bankType: 'COMMERCIAL' },
  { bankName: 'Wintrust Bank', routingNumber: '071000152', swiftCode: 'WINTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Interstate Bank', routingNumber: '092901683', swiftCode: 'FIBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Glacier Bank', routingNumber: '092901683', swiftCode: 'GLBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Banner Bank', routingNumber: '323371076', swiftCode: 'BANUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Columbia Bank', routingNumber: '125000105', swiftCode: 'COLBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Umpqua Bank', routingNumber: '123205054', swiftCode: 'UMPQUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Pacific Premier Bank', routingNumber: '122241655', swiftCode: 'PPBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Western Alliance Bank', routingNumber: '122105278', swiftCode: 'WAALUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Axos Bank', routingNumber: '122287251', swiftCode: 'AXOSUS33', bankType: 'COMMERCIAL' },
  { bankName: 'CIT Bank', routingNumber: '124071889', swiftCode: 'CITBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Customers Bank', routingNumber: '031100869', swiftCode: 'CUSTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Signature Bank', routingNumber: '026013576', swiftCode: 'SIGNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Sterling National Bank', routingNumber: '021200339', swiftCode: 'STNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'New York Community Bank', routingNumber: '026013673', swiftCode: 'NYCBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Provident Bank', routingNumber: '021201486', swiftCode: 'PROVUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Berkshire Bank', routingNumber: '211871074', swiftCode: 'BERKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Bangor Savings Bank', routingNumber: '211274450', swiftCode: 'BANGUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Camden National Bank', routingNumber: '211274450', swiftCode: 'CAMDUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Bar Harbor Bank & Trust', routingNumber: '211274450', swiftCode: 'BARHUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First National Bank of Pennsylvania', routingNumber: '031300012', swiftCode: 'FNBPUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Fulton Bank', routingNumber: '031300012', swiftCode: 'FULTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Susquehanna Bank', routingNumber: '031300012', swiftCode: 'SUSQUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Northwest Bank', routingNumber: '031300012', swiftCode: 'NWBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'S&T Bank', routingNumber: '043000261', swiftCode: 'STBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Commonwealth Bank', routingNumber: '043000261', swiftCode: 'FCBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'WesBanco Bank', routingNumber: '051503394', swiftCode: 'WESBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'United Bank', routingNumber: '051503394', swiftCode: 'UNITBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'City National Bank', routingNumber: '122016066', swiftCode: 'CNBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'East West Bank', routingNumber: '322070381', swiftCode: 'EWBKUS66', bankType: 'COMMERCIAL' },
  { bankName: 'Cathay Bank', routingNumber: '322070243', swiftCode: 'CATHUS6L', bankType: 'COMMERCIAL' },
  { bankName: 'First Hawaiian Bank', routingNumber: '121301028', swiftCode: 'FHBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Bank of Hawaii', routingNumber: '121301028', swiftCode: 'BOHIUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First National Bank Alaska', routingNumber: '125200879', swiftCode: 'FNBAUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Northrim Bank', routingNumber: '125200879', swiftCode: 'NRIMUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Denali State Bank', routingNumber: '125200879', swiftCode: 'DENUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Bank', routingNumber: '101000187', swiftCode: 'FBKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Arvest Bank', routingNumber: '082000109', swiftCode: 'ARVEUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Simmons First National Bank', routingNumber: '082900872', swiftCode: 'SIFNUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Bank OZK', routingNumber: '082900872', swiftCode: 'BOZKUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Centennial Bank', routingNumber: '082900872', swiftCode: 'CENTUS33', bankType: 'COMMERCIAL' },
  { bankName: 'First Security Bank', routingNumber: '082900872', swiftCode: 'FSBUS33', bankType: 'COMMERCIAL' },
  { bankName: 'Great Southern Bank', routingNumber: '081000210', swiftCode: 'GRSOUS33', bankType: 'COMMERCIAL' },
];

async function seedBanks() {
  console.log('🏦 Seeding top 100 US banks...');
  
  try {
    // Delete existing banks
    await prisma.bankList.deleteMany({});
    console.log('✅ Cleared existing banks');
    
    // Insert new banks
    const result = await prisma.bankList.createMany({
      data: top100USBanks,
      skipDuplicates: true,
    });
    
    console.log(`✅ Successfully seeded ${result.count} banks`);
    console.log('🎉 Bank seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding banks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBanks();
