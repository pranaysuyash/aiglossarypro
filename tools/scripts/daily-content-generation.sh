#!/bin/bash

# Daily Content Generation Script for AI/ML Glossary
# Usage: ./scripts/daily-content-generation.sh [category] [count] [sections]
# Example: ./scripts/daily-content-generation.sh "Machine Learning" 10 "introduction,how-it-works,applications"

set -e  # Exit on any error

# Configuration
CATEGORY=${1:-"Machine Learning"}
COUNT=${2:-10}
SECTIONS=${3:-"introduction,how-it-works,applications"}
DATE=$(date +%Y-%m-%d_%H-%M-%S)
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/content-generation-$DATE.log"
REPORTS_DIR="reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$REPORTS_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if npm script exists
check_npm_script() {
    local script_name="$1"
    if npm run | grep -q "^  $script_name$"; then
        return 0
    else
        return 1
    fi
}

# Function to run npm script with error handling
run_npm_script() {
    local script_name="$1"
    shift
    local args="$@"
    
    if check_npm_script "$script_name"; then
        log "Running: npm run $script_name $args"
        if npm run "$script_name" $args 2>&1 | tee -a "$LOG_FILE"; then
            log "✅ Successfully completed: $script_name"
            return 0
        else
            error "❌ Failed to run: $script_name"
            return 1
        fi
    else
        warning "⚠️  Script not found: $script_name (skipping)"
        return 0
    fi
}

# Main execution function
main() {
    log "🚀 Starting Daily Content Generation"
    log "Configuration:"
    log "  Category: $CATEGORY"
    log "  Count: $COUNT"
    log "  Sections: $SECTIONS"
    log "  Log File: $LOG_FILE"
    
    local start_time=$(date +%s)
    local success=true
    
    # Step 1: Database status check
    log "📊 Checking database status..."
    if run_npm_script "db:status"; then
        log "Database is accessible"
    else
        error "Database check failed - continuing anyway"
    fi
    
    # Step 2: Pre-generation quality check
    log "🔍 Running pre-generation quality assessment..."
    if run_npm_script "quality:check" || [ -f "./scripts/quality-assurance.ts" ]; then
        if [ -f "./scripts/quality-assurance.ts" ]; then
            log "Running quality assurance script..."
            if npx tsx ./scripts/quality-assurance.ts 2>&1 | tee -a "$LOG_FILE"; then
                log "Quality check completed"
            else
                warning "Quality check had issues but continuing..."
            fi
        fi
    else
        warning "Quality check script not available"
    fi
    
    # Step 3: Generate terms
    log "🎯 Generating $COUNT terms for category: $CATEGORY"
    if run_npm_script "seed:terms" "--category \"$CATEGORY\" --count $COUNT"; then
        log "✅ Terms generation completed successfully"
    else
        error "❌ Terms generation failed"
        success=false
    fi
    
    # Step 4: Generate sections (if terms generation succeeded)
    if [ "$success" = true ]; then
        log "📝 Generating content sections: $SECTIONS"
        
        # Convert comma-separated sections to individual section generation
        IFS=',' read -ra SECTION_ARRAY <<< "$SECTIONS"
        for section in "${SECTION_ARRAY[@]}"; do
            section=$(echo "$section" | xargs)  # Trim whitespace
            log "Generating section: $section"
            
            if run_npm_script "generate:sections" "--sections \"$section\" --priority high"; then
                log "✅ Generated section: $section"
            else
                warning "⚠️  Failed to generate section: $section"
            fi
        done
    else
        warning "⚠️  Skipping section generation due to term generation failure"
    fi
    
    # Step 5: Content validation
    log "🔍 Validating generated content..."
    if run_npm_script "validate:content"; then
        log "✅ Content validation passed"
    else
        warning "⚠️  Content validation had issues"
    fi
    
    # Step 6: Post-generation quality check
    log "📊 Running post-generation quality assessment..."
    if [ -f "./scripts/quality-assurance.ts" ]; then
        if npx tsx ./scripts/quality-assurance.ts 2>&1 | tee -a "$LOG_FILE"; then
            log "Post-generation quality check completed"
        else
            warning "Post-generation quality check had issues"
        fi
    fi
    
    # Step 7: Generate summary report
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    log "📋 DAILY GENERATION SUMMARY"
    log "════════════════════════════"
    log "Date: $(date)"
    log "Category: $CATEGORY"
    log "Target Count: $COUNT"
    log "Target Sections: $SECTIONS"
    log "Duration: ${minutes}m ${seconds}s"
    log "Status: $([ "$success" = true ] && echo "✅ SUCCESS" || echo "❌ PARTIAL SUCCESS")"
    log "Log File: $LOG_FILE"
    
    # Copy log to reports directory for archival
    cp "$LOG_FILE" "$REPORTS_DIR/daily-generation-$(basename "$LOG_FILE")"
    
    if [ "$success" = true ]; then
        log "🎉 Daily content generation completed successfully!"
        echo -e "${GREEN}✅ SUCCESS: Check $LOG_FILE for detailed logs${NC}"
        exit 0
    else
        error "⚠️  Daily content generation completed with issues"
        echo -e "${YELLOW}⚠️  PARTIAL SUCCESS: Check $LOG_FILE for detailed logs${NC}"
        exit 1
    fi
}

# Function to display usage information
usage() {
    echo "Usage: $0 [category] [count] [sections]"
    echo ""
    echo "Arguments:"
    echo "  category  - AI/ML category name (default: 'Machine Learning')"
    echo "  count     - Number of terms to generate (default: 10)"
    echo "  sections  - Comma-separated list of sections (default: 'introduction,how-it-works,applications')"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 \"Deep Learning\" 15"
    echo "  $0 \"Computer Vision\" 8 \"introduction,applications,best-practices\""
    echo ""
    echo "Available categories:"
    echo "  - Machine Learning"
    echo "  - Deep Learning"
    echo "  - Natural Language Processing"
    echo "  - Computer Vision"
    echo "  - AI Ethics"
    echo "  - Statistics"
    echo "  - Data Science"
    echo "  - Algorithms"
    echo "  - Emerging Technologies"
    echo ""
    echo "Available sections:"
    echo "  - introduction"
    echo "  - how-it-works"
    echo "  - applications"
    echo "  - theoretical-concepts"
    echo "  - implementation"
    echo "  - advantages-disadvantages"
    echo "  - best-practices"
    echo "  - related-concepts"
    echo "  - ethics-responsible-ai"
    echo "  - case-studies"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help|help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac