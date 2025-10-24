declare module '@prisma/nextjs-monorepo-workaround-plugin' {
    import { Compiler } from 'webpack'

    export class PrismaPlugin {
        constructor()
        apply(compiler: Compiler): void
    }
}

