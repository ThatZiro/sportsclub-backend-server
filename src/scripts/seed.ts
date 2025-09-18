import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Get configuration from environment
    const leagueSlug = process.env.LEAGUE_SLUG || 'spring-2024';
    const leagueName = process.env.LEAGUE_NAME || 'Spring 2024 League';
    const leagueSeason = process.env.LEAGUE_SEASON || 'Spring 2024';
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');

    // Create or update the main league
    console.log(`📋 Creating/updating league: ${leagueName}`);
    const league = await prisma.league.upsert({
      where: { slug: leagueSlug },
      update: {
        name: leagueName,
        season: leagueSeason,
        isActive: true,
      },
      create: {
        name: leagueName,
        slug: leagueSlug,
        season: leagueSeason,
        isActive: true,
      },
    });

    // Create sample organizer user
    console.log('👤 Creating sample organizer user...');
    const organizerPassword = await bcrypt.hash('organizer123', bcryptRounds);
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@pbsports.com' },
      update: {
        name: 'League Organizer',
        role: UserRole.ORGANIZER,
        passwordHash: organizerPassword,
      },
      create: {
        email: 'organizer@pbsports.com',
        name: 'League Organizer',
        role: UserRole.ORGANIZER,
        passwordHash: organizerPassword,
      },
    });

    // Create sample users
    console.log('👥 Creating sample users...');
    const users = [];
    
    for (let i = 1; i <= 6; i++) {
      const password = await bcrypt.hash(`user${i}123`, bcryptRounds);
      const user = await prisma.user.upsert({
        where: { email: `user${i}@example.com` },
        update: {
          name: `User ${i}`,
          passwordHash: password,
        },
        create: {
          email: `user${i}@example.com`,
          name: `User ${i}`,
          passwordHash: password,
          role: UserRole.USER,
        },
      });
      users.push(user);
    }

    // Create sample teams
    console.log('🏆 Creating sample teams...');
    const teamData = [
      { name: 'Thunder Bolts', color: '#FFD700', captainIndex: 0 },
      { name: 'Lightning Strikes', color: '#FF6B35', captainIndex: 1 },
      { name: 'Storm Chasers', color: '#4ECDC4', captainIndex: 2 },
    ];

    for (const teamInfo of teamData) {
      const captain = users[teamInfo.captainIndex];
      
      // Create team
      const team = await prisma.team.upsert({
        where: {
          unique_team_name_per_league: {
            name: teamInfo.name,
            leagueId: league.id,
          },
        },
        update: {
          color: teamInfo.color,
          captainId: captain.id,
        },
        create: {
          name: teamInfo.name,
          color: teamInfo.color,
          leagueId: league.id,
          captainId: captain.id,
        },
      });

      // Add captain as approved team member
      await prisma.teamMember.upsert({
        where: {
          unique_team_membership: {
            teamId: team.id,
            userId: captain.id,
          },
        },
        update: {
          role: 'CAPTAIN',
          status: 'APPROVED',
        },
        create: {
          teamId: team.id,
          userId: captain.id,
          role: 'CAPTAIN',
          status: 'APPROVED',
        },
      });

      // Add additional team members
      const memberStartIndex = teamInfo.captainIndex + 3;
      if (memberStartIndex < users.length) {
        const member = users[memberStartIndex];
        await prisma.teamMember.upsert({
          where: {
            unique_team_membership: {
              teamId: team.id,
              userId: member.id,
            },
          },
          update: {
            role: 'MEMBER',
            status: 'APPROVED',
          },
          create: {
            teamId: team.id,
            userId: member.id,
            role: 'MEMBER',
            status: 'APPROVED',
          },
        });
      }

      console.log(`  ✅ Created team: ${teamInfo.name} (Captain: ${captain.name})`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - League: ${league.name} (${league.slug})`);
    console.log(`  - Users: ${users.length + 1} (including organizer)`);
    console.log(`  - Teams: ${teamData.length}`);
    console.log('\n🔐 Test Credentials:');
    console.log('  Organizer: organizer@pbsports.com / organizer123');
    console.log('  Users: user1@example.com / user1123, user2@example.com / user2123, etc.');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });