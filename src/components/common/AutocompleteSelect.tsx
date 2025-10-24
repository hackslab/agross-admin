import React, { useState, useEffect, useRef } from "react";

interface Item {
  id: string;
  name: string;
}

interface AutocompleteSelectProps {
  items: Item[];
  value: string | null; // The selected item's ID
  onChange: (item: Item | null) => void;
  onCreateNew?: (inputValue: string) => void;
  placeholder?: string;
  className?: string;
}

const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  items,
  value,
  onChange,
  onCreateNew,
  placeholder,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync input value with selected item name when `value` prop changes externally
  useEffect(() => {
    const selectedItem = items.find((item) => item.id === value);
    setInputValue(selectedItem ? selectedItem.name : "");
  }, [value, items]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        // If input doesn't match a valid item, reset it
        const currentItem = items.find(
          (item) => item.name.toLowerCase() === inputValue.toLowerCase()
        );
        if (!currentItem) {
          const selectedItem = items.find((item) => item.id === value);
          setInputValue(selectedItem ? selectedItem.name : "");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, inputValue, items, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    if (text) {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredItems(items);
      setIsDropdownOpen(true);
      onChange(null);
    }
  };

  const handleItemClick = (item: Item) => {
    setInputValue(item.name);
    onChange(item);
    setIsDropdownOpen(false);
  };

  const handleCreateNewClick = () => {
    if (onCreateNew) {
      onCreateNew(inputValue);
      setIsDropdownOpen(false);
    }
  };

  const showCreateNew =
    onCreateNew &&
    inputValue &&
    !items.some((item) => item.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          setFilteredItems(
            items.filter((item) =>
              item.name.toLowerCase().includes(inputValue.toLowerCase())
            )
          );
          setIsDropdownOpen(true);
        }}
        placeholder={placeholder || "Variantni tanlang"}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
      />
      {isDropdownOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleItemClick(item)}
            >
              {item.name}
            </div>
          ))}
          {showCreateNew && (
            <div
              className="px-4 py-2 cursor-pointer text-teal-700 font-semibold hover:bg-teal-50"
              onClick={handleCreateNewClick}
            >
              + Yangi "{inputValue}" yaratish
            </div>
          )}
          {filteredItems.length === 0 && !showCreateNew && (
            <div className="px-4 py-2 text-gray-500">Natijalar topilmadi</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSelect;
