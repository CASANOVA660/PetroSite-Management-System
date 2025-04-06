declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';

    export interface IconProps extends SVGProps<SVGSVGElement> {
        size?: number | string;
        color?: string;
        strokeWidth?: number | string;
    }

    export const Plus: FC<IconProps>;
    export const Search: FC<IconProps>;
    export const Filter: FC<IconProps>;
    export const Table: FC<IconProps>;
    export const List: FC<IconProps>;
    export const Eye: FC<IconProps>;
    export const Edit: FC<IconProps>;
    export const Trash: FC<IconProps>;
    export const Check: FC<IconProps>;
    export const X: FC<IconProps>;
    export const ChevronDown: FC<IconProps>;
    export const ChevronUp: FC<IconProps>;
    export const ChevronLeft: FC<IconProps>;
    export const ChevronRight: FC<IconProps>;
    export const Calendar: FC<IconProps>;
    export const Clock: FC<IconProps>;
    export const User: FC<IconProps>;
    export const Users: FC<IconProps>;
    export const Folder: FC<IconProps>;
    export const File: FC<IconProps>;
    export const Settings: FC<IconProps>;
    export const LogOut: FC<IconProps>;
    export const Menu: FC<IconProps>;
    export const Home: FC<IconProps>;
    export const Bell: FC<IconProps>;
    export const Mail: FC<IconProps>;
    export const MessageSquare: FC<IconProps>;
    export const Phone: FC<IconProps>;
    export const Map: FC<IconProps>;
    export const Globe: FC<IconProps>;
    export const Link: FC<IconProps>;
    export const Image: FC<IconProps>;
    export const Video: FC<IconProps>;
    export const Music: FC<IconProps>;
    export const FileText: FC<IconProps>;
    export const FileCode: FC<IconProps>;
    export const FileImage: FC<IconProps>;
    export const FileVideo: FC<IconProps>;
    export const FileAudio: FC<IconProps>;
    export const FileArchive: FC<IconProps>;
    export const FilePdf: FC<IconProps>;
    export const FileWord: FC<IconProps>;
    export const FileExcel: FC<IconProps>;
    export const FilePowerpoint: FC<IconProps>;
    export const Download: FC<IconProps>;
    export const Upload: FC<IconProps>;
    export const Share: FC<IconProps>;
    export const Star: FC<IconProps>;
    export const Heart: FC<IconProps>;
    export const ThumbsUp: FC<IconProps>;
    export const ThumbsDown: FC<IconProps>;
    export const Flag: FC<IconProps>;
    export const Bookmark: FC<IconProps>;
    export const Tag: FC<IconProps>;
    export const Hash: FC<IconProps>;
    export const AtSign: FC<IconProps>;
    export const DollarSign: FC<IconProps>;
    export const EuroSign: FC<IconProps>;
    export const PoundSign: FC<IconProps>;
    export const Percent: FC<IconProps>;
    export const AlertCircle: FC<IconProps>;
    export const AlertTriangle: FC<IconProps>;
    export const AlertOctagon: FC<IconProps>;
    export const Info: FC<IconProps>;
    export const HelpCircle: FC<IconProps>;
    export const CheckCircle: FC<IconProps>;
    export const XCircle: FC<IconProps>;
    export const MinusCircle: FC<IconProps>;
    export const PlusCircle: FC<IconProps>;
    export const Circle: FC<IconProps>;
    export const Square: FC<IconProps>;
    export const Triangle: FC<IconProps>;
    export const Hexagon: FC<IconProps>;
    export const Octagon: FC<IconProps>;
    export const Pentagon: FC<IconProps>;
    export const Diamond: FC<IconProps>;
}

declare module '../components/ui/button' {
    import { FC, ButtonHTMLAttributes } from 'react';

    export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
        variant?: 'default' | 'outline' | 'ghost' | 'link';
        size?: 'default' | 'sm' | 'lg';
        className?: string;
    }

    const Button: FC<ButtonProps>;
    export default Button;
}

declare module '../components/ui/modal' {
    import { FC, ReactNode } from 'react';

    export interface ModalProps {
        isOpen: boolean;
        onClose: () => void;
        children: ReactNode;
        title?: string;
        className?: string;
    }

    const Modal: FC<ModalProps>;
    export default Modal;
} 