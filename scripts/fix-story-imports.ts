#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Fix story imports that are using named imports instead of default imports
async function fixStoryImports() {
  const storyFiles = await glob('client/src/**/*.stories.tsx');
  
  const fixes = [
    { from: "import { GuestAwareTermDetail }", to: "import GuestAwareTermDetail" },
    { from: "import { TermActions }", to: "import TermActions" },
    { from: "import { TermContentTabs }", to: "import TermContentTabs" },
    { from: "import { TermOverview }", to: "import TermOverview" },
    { from: "import { TermRelationships }", to: "import TermRelationships" },
    { from: "import { NavigationPerformanceTest }", to: "import NavigationPerformanceTest" },
    { from: "import { VRConceptSpace }", to: "import VRConceptSpace" },
    { from: "import { About }", to: "import About" },
    { from: "import { AdminContactsDashboard }", to: "import AdminContactsDashboard" },
    { from: "import { AdminNewsletterDashboard }", to: "import AdminNewsletterDashboard" },
    { from: "import { AdminAnalytics }", to: "import AdminAnalytics" },
    { from: "import { Categories }", to: "import Categories" },
    { from: "import { Dashboard }", to: "import Dashboard" },
    { from: "import { EnhancedTermDetail }", to: "import EnhancedTermDetail" },
    { from: "import { Home }", to: "import Home" },
    { from: "import { LifetimeAccess }", to: "import LifetimeAccess" },
    { from: "import { Profile }", to: "import Profile" },
    { from: "import { Progress }", to: "import Progress" },
    { from: "import { PurchaseSuccess }", to: "import PurchaseSuccess" },
    { from: "import { Settings }", to: "import Settings" },
    { from: "import { Subcategories }", to: "import Subcategories" },
    { from: "import { SubcategoryDetail }", to: "import SubcategoryDetail" },
    { from: "import { SurpriseMe }", to: "import SurpriseMe" },
    { from: "import { Trending }", to: "import Trending" },
  ];
  
  let totalFixed = 0;
  
  for (const file of storyFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    for (const fix of fixes) {
      if (content.includes(fix.from)) {
        content = content.replace(fix.from, fix.to);
        modified = true;
        totalFixed++;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`Fixed imports in: ${file}`);
    }
  }
  
  console.log(`\nTotal fixes applied: ${totalFixed}`);
}

fixStoryImports().catch(console.error);