import { coreServices, createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
import { dotnetPackageAdd } from './actions/dotnet-package-add';

export const scaffolderDotnetCliModule = createBackendModule({
    pluginId: 'scaffolder',
    moduleId: 'dotnet-cli',
    register({ registerInit }) {
        registerInit({
            deps: {
                scaffolderActions: scaffolderActionsExtensionPoint,
                config: coreServices.rootConfig,
            },
            async init({ scaffolderActions }) {
                scaffolderActions.addActions(dotnetPackageAdd());
            },
        });
    },
});
