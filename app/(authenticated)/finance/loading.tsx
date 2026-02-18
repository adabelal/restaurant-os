import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function FinanceLoading() {
    return (
        <div className="flex flex-col min-h-screen bg-[#faf9f6] space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-64 rounded-xl" />
                        <Skeleton className="h-6 w-96 rounded-lg" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-14 w-32 rounded-2xl" />
                        <Skeleton className="h-14 w-40 rounded-2xl" />
                    </div>
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-32 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-40 mt-2 mb-4 rounded-lg" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart & Timeline Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm bg-white rounded-[2rem] h-[500px]">
                        <CardHeader>
                            <Skeleton className="h-8 w-48 rounded-lg" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-full w-full rounded-xl" />
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="border-none shadow-sm bg-white rounded-[2rem] h-[500px]">
                        <CardHeader>
                            <Skeleton className="h-8 w-40 rounded-lg" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transactions Skeleton */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem]">
                <CardHeader>
                    <Skeleton className="h-8 w-56 rounded-lg" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-6">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-32" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
