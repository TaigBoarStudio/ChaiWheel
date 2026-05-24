import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, HelpCircle } from "lucide-react";
import { FLAVOR_CATEGORIES } from "../data/flavors";
import { Tea } from "../types";

interface FlavorWheelProps {
  selectedTea: Tea | null;
  activeFilter: string | null; // specific flavor or category
  onSelectFilter: (filter: string | null) => void;
  hoveredItem: string | null;
  setHoveredItem: (item: string | null) => void;
  isAddingMode?: boolean;
  addingFlavors?: string[];
  onToggleAddingFlavor?: (flavor: string) => void;
}

export const FlavorWheel: React.FC<FlavorWheelProps> = ({
  selectedTea,
  activeFilter,
  onSelectFilter,
  hoveredItem,
  setHoveredItem,
  isAddingMode = false,
  addingFlavors = [],
  onToggleAddingFlavor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Zoom and Pan State ---
  const [zoom, setZoom] = useState(1.1); // default slightly enlarged base size
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [modalZoom, setModalZoom] = useState(1.2);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const [modalIsDragging, setModalIsDragging] = useState(false);
  const [modalDragStart, setModalDragStart] = useState({ x: 0, y: 0 });

  // Tracking start positions to distinguish drag from click
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [mouseDownTime, setMouseDownTime] = useState(0);

  // Touch pinch zoom state
  const [startTouchDistance, setStartTouchDistance] = useState<number | null>(null);
  const [startTouchZoom, setStartTouchZoom] = useState<number>(1.2);

  const containerRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Esc key closes full-screen view mode
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Handle active wheel zooming event (preventing outer page scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelZoom = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.08;
      if (e.deltaY < 0) {
        setZoom(z => Math.min(z * zoomFactor, 6));
      } else {
        setZoom(z => Math.max(z / zoomFactor, 0.5));
      }
    };

    container.addEventListener("wheel", handleWheelZoom, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelZoom);
    };
  }, []);

  // Handle active modal wheel zooming event
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      const container = modalContainerRef.current;
      if (!container) return;

      const handleModalWheelZoom = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.08;
        if (e.deltaY < 0) {
          setModalZoom(z => Math.min(z * zoomFactor, 6));
        } else {
          setModalZoom(z => Math.max(z / zoomFactor, 0.5));
        }
      };

      container.addEventListener("wheel", handleModalWheelZoom, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleModalWheelZoom);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [isExpanded]);

  // --- Zoom Helpers ---
  const handleZoomIn = (isModal: boolean) => {
    const setZ = isModal ? setModalZoom : setZoom;
    setZ(z => Math.min(z * 1.25, 6));
  };

  const handleZoomOut = (isModal: boolean) => {
    const setZ = isModal ? setModalZoom : setZoom;
    setZ(z => Math.max(z / 1.25, 0.5));
  };

  const handleResetZoom = (isModal: boolean) => {
    const setZ = isModal ? setModalZoom : setZoom;
    const setP = isModal ? setModalPan : setPan;
    setZ(isModal ? 1.2 : 1.1);
    setP({ x: 0, y: 0 });
  };

  // --- Pointer Down tracking ---
  const handlePointerDown = (clientX: number, clientY: number, isModal: boolean, button: number = 0) => {
    if (button !== 0) return; // Only left mouse button drag
    setMouseDownPos({ x: clientX, y: clientY });
    setMouseDownTime(Date.now());

    const setIsDrag = isModal ? setModalIsDragging : setIsDragging;
    const setStart = isModal ? setModalDragStart : setDragStart;
    const currentPan = isModal ? modalPan : pan;

    setIsDrag(true);
    setStart({ x: clientX - currentPan.x, y: clientY - currentPan.y });
  };

  const handlePointerMove = (clientX: number, clientY: number, isModal: boolean) => {
    const isDrag = isModal ? modalIsDragging : isDragging;
    if (!isDrag) return;

    const setP = isModal ? setModalPan : setPan;
    const start = isModal ? (isModal ? modalDragStart : dragStart) : dragStart;

    setP({
      x: clientX - start.x,
      y: clientY - start.y,
    });
  };

  const handlePointerUp = (isModal: boolean) => {
    const setIsDrag = isModal ? setModalIsDragging : setIsDragging;
    setIsDrag(false);
  };

  const handleTouchStart = (e: React.TouchEvent, isModal: boolean) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, isModal);
      setStartTouchDistance(null);
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setStartTouchDistance(dist);
      setStartTouchZoom(isModal ? modalZoom : zoom);
      
      const setIsDrag = isModal ? setModalIsDragging : setIsDragging;
      setIsDrag(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent, isModal: boolean) => {
    if (e.touches.length === 1) {
      if (startTouchDistance === null) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, isModal);
      }
    } else if (e.touches.length === 2 && startTouchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      if (dist > 10) {
        const scale = dist / startTouchDistance;
        const setZ = isModal ? setModalZoom : setZoom;
        const newZoom = Math.min(Math.max(startTouchZoom * scale, 0.5), 6);
        setZ(newZoom);
      }
    }
  };

  const handleTouchEnd = (isModal: boolean) => {
    handlePointerUp(isModal);
    setStartTouchDistance(null);
  };

  const isClickAction = (clientX: number, clientY: number) => {
    const dx = Math.abs(clientX - mouseDownPos.x);
    const dy = Math.abs(clientY - mouseDownPos.y);
    const elapsed = Date.now() - mouseDownTime;
    return dx < 6 && dy < 6 && elapsed < 350;
  };

  // Pre-calculate angular sectors
  const { totalSlices, slicesMap, categoriesMap } = useMemo(() => {
    let index = 0;
    const slicesList: { name: string; catId: string; catColor: string; startIndex: number }[] = [];
    
    const catList = FLAVOR_CATEGORIES.map(category => {
      const startIndex = index;
      category.items.forEach(item => {
        slicesList.push({
          name: item,
          catId: category.id,
          catColor: category.color,
          startIndex: index,
        });
        index++;
      });
      const endIndex = index;
      return {
        ...category,
        startIndex,
        endIndex,
        itemsCount: category.items.length,
      };
    });

    return {
      totalSlices: index,
      slicesMap: slicesList,
      categoriesMap: catList,
    };
  }, []);

  // Center coordinate of the wheel coordinates
  const viewBoxWidth = 1050;
  const viewBoxHeight = 1050;
  const center = 525;

  // Radii - Enlarged and fine tuned for ideal spacing and extreme legibility
  const rCenterEmblem = 100;
  const rInnerStart = 115;
  const rInnerEnd = 242;
  const rOuterStart = 248;
  const rOuterEnd = 380;
  const rTextStart = 392;

  // Transform degrees or index to radians
  const getAngleRad = (sliceIndex: number) => {
    return -Math.PI / 2 + (sliceIndex / totalSlices) * Math.PI * 2;
  };

  // Build SVG path for an annular sector
  const getArcPath = (
    startAngleRad: number,
    endAngleRad: number,
    innerR: number,
    outerR: number
  ) => {
    const x11 = center + innerR * Math.cos(startAngleRad);
    const y11 = center + innerR * Math.sin(startAngleRad);
    const x12 = center + outerR * Math.cos(startAngleRad);
    const y12 = center + outerR * Math.sin(startAngleRad);
    const x21 = center + innerR * Math.cos(endAngleRad);
    const y21 = center + innerR * Math.sin(endAngleRad);
    const x22 = center + outerR * Math.cos(endAngleRad);
    const y22 = center + outerR * Math.sin(endAngleRad);

    const largeArcFlag = endAngleRad - startAngleRad > Math.PI ? 1 : 0;

    return `
      M ${x12} ${y12}
      A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x22} ${y22}
      L ${x21} ${y21}
      A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x11} ${y11}
      Z
    `.trim();
  };

  const isFlavorHighlighted = (flavorName: string) => {
    if (isAddingMode) {
      if (addingFlavors.length === 0) return true;
      return addingFlavors.includes(flavorName);
    }
    if (selectedTea) {
      return selectedTea.flavors.includes(flavorName);
    }
    if (activeFilter) {
      const isCatFilter = FLAVOR_CATEGORIES.some(c => c.name === activeFilter);
      if (isCatFilter) {
        const cat = FLAVOR_CATEGORIES.find(c => c.name === activeFilter);
        return cat?.items.includes(flavorName) ?? false;
      }
      return activeFilter === flavorName;
    }
    return true;
  };

  const isCategoryHighlighted = (catName: string, catItems: string[]) => {
    if (isAddingMode) {
      if (addingFlavors.length === 0) return true;
      return catItems.some(item => addingFlavors.includes(item));
    }
    if (selectedTea) {
      return catItems.some(item => selectedTea.flavors.includes(item));
    }
    if (activeFilter === catName) {
      return true;
    }
    if (activeFilter) {
      return catItems.includes(activeFilter);
    }
    return true;
  };

  const handleSliceClick = (clientX: number, clientY: number, flavorName: string) => {
    if (!isClickAction(clientX, clientY)) return; // Prevents triggering click during drags
    if (isAddingMode) {
      if (onToggleAddingFlavor) {
        onToggleAddingFlavor(flavorName);
      }
    } else {
      if (activeFilter === flavorName) {
        onSelectFilter(null);
      } else {
        onSelectFilter(flavorName);
      }
    }
  };

  const handleCategoryClick = (clientX: number, clientY: number, catName: string, catItems: string[]) => {
    if (!isClickAction(clientX, clientY)) return; // Prevents triggering during drag
    if (isAddingMode) {
      if (onToggleAddingFlavor) {
        // Decide whether to select all or deselect all items of this category
        const allSelected = catItems.every(item => addingFlavors.includes(item));
        if (allSelected) {
          // Deselect all items in this category
          catItems.forEach(item => {
            if (addingFlavors.includes(item)) {
              onToggleAddingFlavor(item);
            }
          });
        } else {
          // Select all remaining items in this category
          catItems.forEach(item => {
            if (!addingFlavors.includes(item)) {
              onToggleAddingFlavor(item);
            }
          });
        }
      }
    } else {
      if (activeFilter === catName) {
        onSelectFilter(null);
      } else {
        onSelectFilter(catName);
      }
    }
  };

  const handleCenterClick = (clientX: number, clientY: number) => {
    if (!isClickAction(clientX, clientY)) return;
    if (isAddingMode) return; // Do nothing in adding mode on center click
    onSelectFilter(null);
  };

  const isAnyFilterOrSelect = isAddingMode
    ? addingFlavors.length > 0 || hoveredItem !== null
    : selectedTea !== null || activeFilter !== null || hoveredItem !== null;

  // Render method used by both normal view and dialog overlay view
  const renderWheelSVG = (isModal: boolean = false) => {
    const idSuffix = isModal ? "-modal" : "-normal";
    const currentDrag = isModal ? modalIsDragging : isDragging;
    const currentZoom = isModal ? modalZoom : zoom;
    const currentPan = isModal ? modalPan : pan;

    const transformStyle = {
      transform: `translate(${currentPan.x}px, ${currentPan.y}px) scale(${currentZoom})`,
      transformOrigin: `${center}px ${center}px`,
      transition: currentDrag ? "none" : "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)",
    };

    return (
      <svg
        id={isModal ? "tea-aroma-wheel-svg-modal" : "tea-aroma-wheel-svg-normal"}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full select-none overflow-visible touch-none"
      >
        <defs />

        <g style={transformStyle} id={`zoomable-panning-group${idSuffix}`}>
          {/* 1. OUTER FLAVOR ELEMENTS */}
          <g id={`outer-flavor-slices${idSuffix}`}>
            {slicesMap.map((slice, i) => {
              const startAng = getAngleRad(i);
              const endAng = getAngleRad(i + 1);
              
              const midAngRad = (startAng + endAng) / 2;
              let midAngDeg = (midAngRad * 180) / Math.PI;

              // Normalize to [-180, 180) to accurately detect left vs right halves
              while (midAngDeg < -180) midAngDeg += 360;
              while (midAngDeg >= 180) midAngDeg -= 360;

              const isLeftHalf = midAngDeg > 90 || midAngDeg < -90;
              const rotAngle = isLeftHalf ? midAngDeg + 180 : midAngDeg;
              const xPos = isLeftHalf ? -rTextStart : rTextStart;
              const textAnchor = isLeftHalf ? "end" : "start";
              
              const isHighlighted = isFlavorHighlighted(slice.name);
              const isHovered = hoveredItem === slice.name;
              
              let fillOpacity = 1;
              if (isAnyFilterOrSelect) {
                if (isHovered) fillOpacity = 1;
                else if (isHighlighted) fillOpacity = 0.95;
                else fillOpacity = 0.12;
              } else {
                fillOpacity = 0.95;
              }

              const pathD = getArcPath(startAng, endAng, rOuterStart, rOuterEnd);

              return (
                <g
                  key={`slice-${slice.name}-${i}${idSuffix}`}
                  className="cursor-pointer group"
                  onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, isModal, e.button)}
                  onMouseUp={(e) => handleSliceClick(e.clientX, e.clientY, slice.name)}
                  onMouseEnter={() => setHoveredItem(slice.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <path
                    d={pathD}
                    fill={slice.catColor}
                    opacity={fillOpacity}
                    className="transition-all duration-300 hover:brightness-125 hover:stroke-white/10"
                    stroke="#0A0B0C"
                    strokeWidth="1.2"
                  />

                  <g transform={`translate(${center}, ${center}) rotate(${rotAngle})`}>
                    <text
                      x={xPos}
                      y={0}
                      dy="0.32em"
                      textAnchor={textAnchor}
                      fontSize={isModal ? "14" : "11.5"}
                      className="font-sans fill-slate-300 hover:fill-white font-semibold select-none pointer-events-none tracking-wide"
                      opacity={isAnyFilterOrSelect && !isHighlighted && !isHovered ? 0.25 : 1}
                    >
                      {slice.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 2. INNER CATEGORY ELEMENTS */}
          <g id={`inner-categories${idSuffix}`}>
            {categoriesMap.map((cat) => {
              const startAng = getAngleRad(cat.startIndex);
              const endAng = getAngleRad(cat.endIndex);
              
              const isHighlighted = isCategoryHighlighted(cat.name, cat.items);
              const isHovered = hoveredItem === cat.name;

              let fillOpacity = 1;
              if (isAnyFilterOrSelect) {
                if (isHovered) fillOpacity = 1;
                else if (isHighlighted) fillOpacity = 0.9;
                else fillOpacity = 0.15;
              } else {
                fillOpacity = 0.9;
              }

              const pathD = getArcPath(startAng, endAng, rInnerStart, rInnerEnd);

              // Angular midpoint
              const midAngRad = (startAng + endAng) / 2;
              let angleDeg = (midAngRad * 180) / Math.PI;

              // Normalize to [-180, 180)
              while (angleDeg < -180) angleDeg += 360;
              while (angleDeg >= 180) angleDeg -= 360;

              // Detect if left half to flip text so it's always readable left-to-right
              const isLeftHalf = angleDeg > 90 || angleDeg < -90;

              const rotAngle = isLeftHalf ? angleDeg + 180 : angleDeg;
              const xPos = isLeftHalf ? -(rInnerStart + 12) : (rInnerStart + 12);
              const textAnchor = isLeftHalf ? "end" : "start";

              return (
                <g
                  key={`cat-${cat.id}${idSuffix}`}
                  className="cursor-pointer"
                  onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, isModal, e.button)}
                  onMouseUp={(e) => handleCategoryClick(e.clientX, e.clientY, cat.name, cat.items)}
                  onMouseEnter={() => setHoveredItem(cat.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <path
                    d={pathD}
                    fill={cat.color}
                    opacity={fillOpacity}
                    className="transition-all duration-300 hover:brightness-110"
                    stroke="#0A0B0C"
                    strokeWidth="2"
                  />

                  <g transform={`translate(${center}, ${center}) rotate(${rotAngle})`}>
                    <text
                      x={xPos}
                      y={0}
                      dy="0.32em"
                      textAnchor={textAnchor}
                      fontSize={isModal ? "12" : "9"}
                      className="font-sans font-black select-none fill-white tracking-widest pointer-events-none drop-shadow-md uppercase"
                      opacity={isAnyFilterOrSelect && !isHighlighted && !isHovered ? 0.35 : 1}
                    >
                      {cat.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 3. CENTER EMBLEM */}
          <g
            id={`center-emblem${idSuffix}`}
            className="cursor-pointer"
            transform={`translate(${center}, ${center})`}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, isModal, e.button)}
            onMouseUp={(e) => handleCenterClick(e.clientX, e.clientY)}
          >
            <circle
              cx={0}
              cy={0}
              r={rCenterEmblem}
              className="fill-[#0C0E11] stroke-white/10 transition-all duration-300 hover:stroke-emerald-500/35"
              strokeWidth="4"
            />

            <circle
              cx={0}
              cy={0}
              r={rCenterEmblem - 2}
              fill="none"
              stroke={selectedTea ? "#10B981" : activeFilter ? "#10B981" : isAddingMode && addingFlavors.length > 0 ? "#10B981" : "transparent"}
              strokeWidth="3"
              className="transition-all duration-500 animate-pulse"
            />

            {selectedTea ? (
              <g className="pointer-events-none">
                <text
                  x={0}
                  y={-22}
                  textAnchor="middle"
                  fontSize="125%"
                  className="fill-slate-400 font-sans tracking-wide font-medium uppercase"
                >
                  Оценка
                </text>
                <text
                  x={0}
                  y={12}
                  textAnchor="middle"
                  fontSize="28px"
                  className="fill-emerald-400 font-sans font-extrabold"
                >
                  {"★".repeat(selectedTea.rating)}
                  {"☆".repeat(5 - selectedTea.rating)}
                </text>
                <text
                  x={0}
                  y={38}
                  textAnchor="middle"
                  fontSize="125%"
                  className="fill-slate-500 font-mono font-medium"
                >
                  {selectedTea.flavors.length} вкусов
                </text>
              </g>
            ) : activeFilter ? (
              <g className="pointer-events-none">
                <text
                  x={0}
                  y={-18}
                  textAnchor="middle"
                  fontSize="115%"
                  className="fill-slate-400 font-sans uppercase font-medium tracking-wide"
                >
                  Фильтр:
                </text>
                <text
                  x={0}
                  y={12}
                  textAnchor="middle"
                  fontSize="14px"
                  className="fill-emerald-400 font-sans font-bold max-w-[170px] truncate"
                >
                  {activeFilter.length > 15 ? `${activeFilter.slice(0, 14)}...` : activeFilter}
                </text>
                <text
                  x={0}
                  y={36}
                  textAnchor="middle"
                  fontSize="10px"
                  className="fill-slate-500 font-sans underline"
                >
                  Сбросить
                </text>
              </g>
            ) : isAddingMode ? (
              <g className="pointer-events-none">
                <text
                  x={0}
                  y={-20}
                  textAnchor="middle"
                  fontSize="14px"
                  className="fill-slate-400 font-sans uppercase font-semibold tracking-wider font-mono text-[10px]"
                >
                  ВЫБРАНО
                </text>
                <text
                  x={0}
                  y={12}
                  textAnchor="middle"
                  fontSize="32px"
                  className="fill-emerald-400 font-sans font-black"
                >
                  {addingFlavors.length}
                </text>
                <text
                  x={0}
                  y={34}
                  textAnchor="middle"
                  fontSize="11.5px"
                  className="fill-slate-500 font-sans font-bold uppercase tracking-wide"
                >
                  {addingFlavors.length % 10 === 1 && addingFlavors.length % 100 !== 11
                    ? "вкус"
                    : [2, 3, 4].includes(addingFlavors.length % 10) && ![12, 13, 14].includes(addingFlavors.length % 100)
                    ? "вкуса"
                    : "вкусов"}
                </text>
              </g>
            ) : (
              <g className="pointer-events-none stroke-slate-500 hover:stroke-slate-300 transition-all duration-300">
                <circle cx={0} cy={0} r={55} fill="none" strokeWidth="2.5" />
                <line x1={0} y1={-55} x2={0} y2={55} strokeWidth="2.5" />
                <line x1={-55} y1={0} x2={55} y2={0} strokeWidth="2.5" />
                
                <path d="M -38 -18 C -18 -38, 18 -38, 38 -18" fill="none" strokeWidth="2.5" />
                <path d="M -38 18 C -18 38, 18 38, 38 18" fill="none" strokeWidth="2.5" />
                <circle cx={0} cy={0} r={22} fill="none" strokeWidth="2" />
                <circle cx={0} cy={0} r={8} className="fill-slate-500" />
              </g>
            )}
          </g>
        </g>
      </svg>
    );
  };

  return (
    <>
      <div id="aroma-wheel-container" className="relative w-full max-w-[850px] mx-auto bg-[#121417]/80 p-5 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl transition-all duration-300 flex flex-col">
        
        {/* Toggle Expand/Maximize Button of extreme craft with tooltip */}
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-all border border-white/5 flex items-center justify-center cursor-pointer shadow-md group z-20"
          title="Открыть во весь экран"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="absolute right-12 scale-0 group-hover:scale-100 transition-all origin-right bg-[#0A0B0C] border border-white/10 text-slate-300 text-[10px] font-mono whitespace-nowrap px-2.5 py-1.5 rounded-lg mr-2 font-semibold shadow-xl">
            РАСКРЫТЬ НА ВЕСЬ ЭКРАН
          </span>
        </button>

        {/* Dynamic Zoom & Reset Toolbar Float */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-[#0A0B0C]/90 border border-white/10 p-1 rounded-xl backdrop-blur-lg z-20 shadow-lg select-none">
          <button
            type="button"
            onClick={() => handleZoomIn(false)}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Приблизить"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomOut(false)}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Отдалить"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleResetZoom(false)}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Сбросить масштаб и положение"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="border-l border-white/15 h-4 mx-1"></div>
          <span className="text-[10px] font-mono font-bold text-slate-400 px-1.5">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Help tooltip to trigger visual clue for interactability */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-[#0A0B0C]/20 border border-white/5 px-2 py-1 rounded-lg pointer-events-none">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Колесико мыши + Тянуть</span>
        </div>

        {/* Viewport Frame Box with custom grab indicators */}
        <div
          ref={containerRef}
          className={`relative w-full aspect-square overflow-hidden bg-[#0A0B0C]/40 rounded-2xl border border-white/5 transition-colors duration-200 mt-8 touch-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, false, e.button)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY, false)}
          onMouseUp={() => handlePointerUp(false)}
          onMouseLeave={() => handlePointerUp(false)}
          onTouchStart={(e) => handleTouchStart(e, false)}
          onTouchMove={(e) => handleTouchMove(e, false)}
          onTouchEnd={() => handleTouchEnd(false)}
          onDoubleClick={() => handleResetZoom(false)}
          title="Дважды кликните, чтобы сбросить"
        >
          {renderWheelSVG(false)}
        </div>

        {/* Normal Mode Tooltip Layer */}
        <AnimatePresence>
          {hoveredItem && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#0A0B0C]/95 border border-white/10 px-4 py-2.5 rounded-xl shadow-xl text-center backdrop-blur-md pointer-events-none z-50 min-w-[200px]"
            >
              <span className="text-xs text-slate-400 block font-mono uppercase tracking-widest mb-0.5">
                {FLAVOR_CATEGORIES.some(c => c.name === hoveredItem) ? "Категория Ароматов" : "Вкусовая Нота"}
              </span>
              <span className="text-sm text-white font-bold font-sans">
                {hoveredItem}
              </span>
              {!selectedTea && (
                <span className="block text-[10px] text-emerald-400 mt-1 font-mono uppercase tracking-wider">
                  Нажмите для фильтрации
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full-Screen Immersive Dialog Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/98 backdrop-blur-2xl z-[999] flex flex-col p-4 md:p-8 select-none"
          >
            {/* Modal Header */}
            <div className="w-full max-w-5xl mx-auto flex justify-end items-center pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase font-mono shadow-md"
              >
                <Minimize2 className="w-4 h-4 text-emerald-400" />
                <span>Свернуть колесо</span>
              </button>
            </div>

            {/* Modal Interactive Area */}
            <div className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center p-4">
              <div
                ref={modalContainerRef}
                className={`w-full max-w-[min(80vh,800px)] aspect-square relative bg-[#121417]/50 border border-white/5 rounded-[40px] p-6 md:p-10 shadow-3xl flex items-center justify-center overflow-hidden transition-colors duration-200 touch-none ${
                  modalIsDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, true, e.button)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY, true)}
                onMouseUp={() => handlePointerUp(true)}
                onMouseLeave={() => handlePointerUp(true)}
                onTouchStart={(e) => handleTouchStart(e, true)}
                onTouchMove={(e) => handleTouchMove(e, true)}
                onTouchEnd={() => handleTouchEnd(true)}
                onDoubleClick={() => handleResetZoom(true)}
                title="Дважды кликните, чтобы сбросить масштаб"
              >
                
                {renderWheelSVG(true)}

                {/* Modal Floating Premium Zoom Control Pad */}
                <div className="absolute bottom-6 left-6 flex items-center gap-1.5 bg-[#0A0B0C]/90 border border-white/10 p-1.5 rounded-xl backdrop-blur-md z-50 shadow-xl select-none">
                  <button
                    type="button"
                    onClick={() => handleZoomIn(true)}
                    className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Приблизить"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoomOut(true)}
                    className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Отдалить"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetZoom(true)}
                    className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Сбросить"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="border-l border-white/15 h-5 mx-1"></div>
                  <span className="text-xs font-mono font-bold text-slate-300 px-2.5">
                    Масштаб {Math.round(modalZoom * 100)}%
                  </span>
                </div>

                {/* Full screen floating Tooltip inside the big wheel view */}
                <AnimatePresence>
                  {hoveredItem && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-8 right-8 bg-[#0A0B0C] border border-white/10 px-5 py-3 rounded-2xl shadow-2xl text-center backdrop-blur-md pointer-events-none z-50 min-w-[240px]"
                    >
                      <span className="text-[10px] text-slate-500 block font-mono uppercase tracking-widest mb-1">
                        {FLAVOR_CATEGORIES.some(c => c.name === hoveredItem) ? "Категория Ароматов" : "Вкусовая Нота"}
                      </span>
                      <span className="text-base text-white font-bold font-sans">
                        {hoveredItem}
                      </span>
                      {!selectedTea && (
                        <span className="block text-[10px] text-emerald-400 mt-1 font-mono uppercase tracking-wider">
                          Нажмите для фильтрации
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
