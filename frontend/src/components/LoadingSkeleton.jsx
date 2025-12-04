/**
 * LoadingSkeleton Component
 * 
 * Displays animated loading placeholders for various content types.
 * Provides better UX than spinners by showing content structure while loading.
 * 
 * Features:
 * - Multiple skeleton types (card, list, form, table)
 * - Animated shimmer effect
 * - Responsive design
 * - Customizable count for repeated elements
 */

/**
 * Base skeleton element with shimmer animation.
 */
const SkeletonElement = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

/**
 * Card skeleton for dashboard cards and business cards.
 */
export const CardSkeleton = ({ count = 1 }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
                <SkeletonElement className="h-6 w-3/4 mb-4" />
                <SkeletonElement className="h-4 w-full mb-2" />
                <SkeletonElement className="h-4 w-5/6 mb-4" />
                <div className="flex space-x-2">
                    <SkeletonElement className="h-10 flex-1" />
                    <SkeletonElement className="h-10 flex-1" />
                </div>
            </div>
        ))}
    </>
);

/**
 * List item skeleton for appointment lists.
 */
export const ListItemSkeleton = ({ count = 3 }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                    <SkeletonElement className="h-5 w-1/3" />
                    <SkeletonElement className="h-6 w-20" />
                </div>
                <SkeletonElement className="h-4 w-1/2 mb-2" />
                <SkeletonElement className="h-4 w-2/3 mb-2" />
                <SkeletonElement className="h-4 w-1/4" />
            </div>
        ))}
    </>
);

/**
 * Form skeleton for profile and business forms.
 */
export const FormSkeleton = () => (
    <div className="space-y-6">
        <div>
            <SkeletonElement className="h-4 w-24 mb-2" />
            <SkeletonElement className="h-10 w-full" />
        </div>
        <div>
            <SkeletonElement className="h-4 w-32 mb-2" />
            <SkeletonElement className="h-10 w-full" />
        </div>
        <div>
            <SkeletonElement className="h-4 w-28 mb-2" />
            <SkeletonElement className="h-24 w-full" />
        </div>
        <SkeletonElement className="h-10 w-32" />
    </div>
);

/**
 * Table skeleton for appointment management.
 */
export const TableSkeleton = ({ rows = 5 }) => (
    <div className="overflow-x-auto">
        <div className="min-w-full">
            {/* Header */}
            <div className="border-b border-gray-200 pb-3 mb-3">
                <div className="flex space-x-4">
                    <SkeletonElement className="h-4 w-1/4" />
                    <SkeletonElement className="h-4 w-1/4" />
                    <SkeletonElement className="h-4 w-1/4" />
                    <SkeletonElement className="h-4 w-1/4" />
                </div>
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="border-b border-gray-100 py-3">
                    <div className="flex space-x-4">
                        <SkeletonElement className="h-4 w-1/4" />
                        <SkeletonElement className="h-4 w-1/4" />
                        <SkeletonElement className="h-4 w-1/4" />
                        <SkeletonElement className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * Dashboard skeleton for initial dashboard load.
 */
export const DashboardSkeleton = () => (
    <div className="space-y-6">
        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow p-6">
            <SkeletonElement className="h-8 w-1/3 mb-2" />
            <SkeletonElement className="h-4 w-1/2 mb-2" />
            <SkeletonElement className="h-4 w-1/4" />
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton count={3} />
        </div>
    </div>
);

/**
 * Profile skeleton for profile section.
 */
export const ProfileSkeleton = () => (
    <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
            <SkeletonElement className="h-6 w-32 mb-2" />
            <SkeletonElement className="h-4 w-48" />
        </div>
        <div className="p-6">
            <FormSkeleton />
        </div>
    </div>
);

const LoadingSkeleton = {
    Card: CardSkeleton,
    ListItem: ListItemSkeleton,
    Form: FormSkeleton,
    Table: TableSkeleton,
    Dashboard: DashboardSkeleton,
    Profile: ProfileSkeleton,
};

export default LoadingSkeleton;
