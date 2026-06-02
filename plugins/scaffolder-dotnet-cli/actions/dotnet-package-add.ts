import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import {
    createTemplateAction,
    executeShellCommand,
} from '@backstage/plugin-scaffolder-node';

export const dotnetPackageAdd = () => {
    return createTemplateAction({
        id: 'dotnet-cli:package:add',
        description: 'Runs the dotnet package add cli command',
        schema: {
            input: {
                packageId: z => z.string()
                    .regex(/^[a-zA-Z0-9_.-]+(@\d+(\.\d+){0,3}(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?)?$/)
                    .describe(`Package reference in the form of a package identifier like 'Newtonsoft.Json' or package identifier and version separated by '@' like 'Newtonsoft.Json@13.0.3'.`),
                rawFlags: z => z.array(z.string()
                    .regex(/^--?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\s+\S+)?$/))
                    .describe('Passes the strings as flags')
                    .optional(),
                version: z => z.string()
                    .regex(/^\d+(\.\d+){0,3}(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/)
                    .describe('The version of the package to add, like "13.0.3" or "8.0.0-preview.1".')
                    .optional(),
                project: z => z.string()
                    .describe('The project file to operate on. If a file is not specified, the command will search the current directory for one.')
                    .optional(),
                source: z => z.string()
                    .describe('The NuGet package source to use during the restore.')
                    .optional(),
                prerelease: z => z.boolean()
                    .describe('Allows prerelease packages to be installed. [default: False]')
                    .optional(),
                targetPath: z => z.string()
                    .describe('Target path within the working directory to run the command from.')
                    .optional()
            }
        },
        async handler(ctx) {
            const targetDir = resolveSafeChildPath(
                ctx.workspacePath,
                ctx.input.targetPath ?? './'
            );

            const command = 'dotnet package add';

            const args = resolveArgs(ctx.input);

            ctx.logger.info(`Running action 'dotnet-cli:package:add', command '${command} ${args}'`);

            await executeShellCommand({
                command: 'dotnet package add',
                args: args,
                options: {
                    cwd: targetDir,
                },
                logger: ctx.logger
            });

            ctx.logger.info(`✔ successfully ran action 'dotnet-cli:package:add', command ${command} ${args}`);
        }
    });
};

type PackageAddInput = {
    packageId: string;
    version?: string;
    prerelease?: boolean;
    source?: string;
    project?: string;
    rawFlags?: string[];
};

function resolveArgs(input: PackageAddInput): string[] {
    const args: string[] = [];

    args.push(input.packageId.split('@')[0]);

    const version = resolveVersionArg(input);
    if (version) args.push('--version', version);

    if (input.prerelease) args.push('--prerelease');
    if (input.source) args.push('--source', input.source);
    if (input.project) args.push(input.project);

    if (input.rawFlags) {
        input.rawFlags
            .filter(f => !/^(-v|--version)\b/.test(f))
            .flatMap(f => f.split(/\s+/))
            .forEach(a => args.push(a));
    }

    return args;
}

function resolveVersionArg(input: PackageAddInput): string | undefined {
    if (input.packageId.includes('@')) {
        return input.packageId.split('@')[1];
    }
    if (input.version) {
        return input.version;
    }
    const versionFlag = input.rawFlags?.find(f => /^(-v|--version)\s+\S+$/.test(f));
    if (versionFlag) return versionFlag.split(/\s+/)[1];

    return undefined;
}