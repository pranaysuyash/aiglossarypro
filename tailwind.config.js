export default {
    darkMode: ['class'],
    content: [
        './apps/web/index.html',
        './apps/web/src/**/*.{js,jsx,ts,tsx}',
        './apps/web/src/**/*.html',
        './packages/**/*.{js,jsx,ts,tsx}',
        // Exclude test and story files from CSS scanning
        '!./apps/web/src/**/*.{test,spec,stories}.{js,jsx,ts,tsx}',
        '!./apps/web/src/**/__tests__/**/*',
        '!./apps/web/src/**/*.d.ts',
    ],
    theme: {
        // Reduce breakpoints - remove rarely used ones
        screens: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
        },
        extend: {
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            colors: {
                // Simplify color palette - use CSS variables only
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
    // Optimize CSS output
    corePlugins: {
        // Keep only essential plugins
        preflight: true,
        container: false,
        accessibility: true,
        backgroundClip: true,
        backgroundImage: true,
        backgroundOpacity: true,
        borderRadius: true,
        borderWidth: true,
        borderColor: true,
        borderOpacity: true,
        boxShadow: true,
        cursor: true,
        display: true,
        flex: true,
        flexBasis: true,
        flexDirection: true,
        flexGrow: true,
        flexShrink: true,
        flexWrap: true,
        fontFamily: true,
        fontSize: true,
        fontSmoothing: true,
        fontStyle: true,
        fontWeight: true,
        gap: true,
        gradientColorStops: true,
        gridAutoRows: true,
        gridColumn: true,
        gridTemplateColumns: true,
        height: true,
        inset: true,
        justifyContent: true,
        letterSpacing: true,
        lineHeight: true,
        margin: true,
        maxHeight: true,
        maxWidth: true,
        minHeight: true,
        minWidth: true,
        objectFit: true,
        opacity: true,
        outline: true,
        overflow: true,
        padding: true,
        placeholderColor: true,
        pointerEvents: true,
        position: true,
        ringColor: true,
        ringOffsetColor: true,
        ringOffsetWidth: true,
        ringWidth: true,
        space: true,
        textAlign: true,
        textColor: true,
        textDecoration: true,
        textOverflow: true,
        textTransform: true,
        transform: true,
        transitionDuration: true,
        transitionProperty: true,
        transitionTimingFunction: true,
        userSelect: true,
        visibility: true,
        whitespace: true,
        width: true,
        zIndex: true,
        // Disable all other plugins
        appearance: false,
        backgroundAttachment: false,
        backgroundPosition: false,
        backgroundRepeat: false,
        backgroundSize: false,
        borderCollapse: false,
        borderSpacing: false,
        caretColor: false,
        clear: false,
        columns: false,
        content: false,
        divideColor: false,
        divideOpacity: false,
        divideStyle: false,
        divideWidth: false,
        fill: false,
        float: false,
        fontVariantNumeric: false,
        gridAutoColumns: false,
        gridAutoFlow: false,
        gridColumnEnd: false,
        gridColumnStart: false,
        gridRow: false,
        gridRowEnd: false,
        gridRowStart: false,
        gridTemplateRows: false,
        hueRotate: false,
        isolation: false,
        justifyItems: false,
        justifySelf: false,
        listStylePosition: false,
        listStyleType: false,
        mixBlendMode: false,
        objectPosition: false,
        order: false,
        overscrollBehavior: false,
        placeContent: false,
        placeItems: false,
        placeSelf: false,
        placeholderOpacity: false,
        resize: false,
        ringOpacity: false,
        rotate: false,
        saturate: false,
        scale: false,
        scrollBehavior: false,
        scrollMargin: false,
        scrollPadding: false,
        scrollSnapAlign: false,
        scrollSnapStop: false,
        scrollSnapType: false,
        sepia: false,
        skew: false,
        stroke: false,
        strokeWidth: false,
        tableLayout: false,
        textDecorationColor: false,
        textDecorationStyle: false,
        textDecorationThickness: false,
        textIndent: false,
        textOpacity: false,
        textUnderlineOffset: false,
        transformOrigin: false,
        transitionDelay: false,
        translate: false,
        verticalAlign: false,
        willChange: false,
        wordBreak: false,
    },
};
