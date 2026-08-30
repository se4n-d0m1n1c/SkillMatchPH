import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Custom dropdown that replaces a native <select>.
 *
 * The listbox is rendered through a portal to <body> and positioned with
 * `position: fixed`, so a native Chromium select popup is NOT rendered. This
 * avoids the known Chromium bug where a native <select> inside a modal with
 * backdrop-filter / transform renders a clipped, blank dropdown.
 */
const MenuSelect = ({
  value,
  onChange,
  options,
  label,
  id,
  menuMaxHeight = 320,
}) => {
  const items = useMemo(
    () => options.map((option) => (typeof option === 'string'
      ? { value: option, label: option }
      : option)),
    [options],
  );

  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = items.find((item) => item.value === value);

  const positionMenu = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const itemHeight = 44;
    const menuHeight = Math.min(items.length * itemHeight + 12, menuMaxHeight);
    const gap = 6;

    let top = rect.bottom + gap;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < menuHeight + gap && rect.top > menuHeight + gap) {
      top = rect.top - menuHeight - gap;
    }

    const left = Math.min(rect.left, window.innerWidth - 280 - 8);
    const width = Math.max(rect.width, 200);

    setMenuPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (open) positionMenu();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onResize = () => positionMenu();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const selectOption = (option) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="menu-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="menu-select-value">{selected?.label ?? 'Select…'}</span>
        <ChevronDown size={18} className={`menu-select-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && menuPos
        ? createPortal(
            <ul
              ref={menuRef}
              className="menu-select-menu"
              role="listbox"
              aria-label={label}
              style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
            >
              {items.map((item) => {
                const isSelected = item.value === value;
                return (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`menu-select-option ${isSelected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => selectOption(item)}
                  >
                    <span className="menu-select-option-label">{item.label}</span>
                    {isSelected ? <Check size={16} /> : null}
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
};

export default MenuSelect;
