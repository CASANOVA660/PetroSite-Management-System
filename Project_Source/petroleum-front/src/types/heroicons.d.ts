declare module '@heroicons/react/outline' {
    import { FC, SVGProps } from 'react';

    export interface IconProps extends SVGProps<SVGSVGElement> {
        title?: string;
        titleId?: string;
    }

    export const SearchIcon: FC<IconProps>;
    export const DocumentIcon: FC<IconProps>;
    export const LinkIcon: FC<IconProps>;
    export const PhotographIcon: FC<IconProps>;
    export const FilmIcon: FC<IconProps>;
    export const FolderIcon: FC<IconProps>;
}

declare module '@heroicons/react/solid' {
    import { FC, SVGProps } from 'react';

    export interface IconProps extends SVGProps<SVGSVGElement> {
        title?: string;
        titleId?: string;
    }

    export const PaperAirplaneIcon: FC<IconProps>;
} 