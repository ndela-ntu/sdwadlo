"use client";

import getColorName from "@/lib/color-name";
import IColor from "@/models/color";
import { useCallback, useEffect, useState } from "react";
import ShadowedBox from "../shadowed-box";
import { Button } from "@/components/ui/button";
import Header2 from "../header2";
import Divider from "../divider";
import { Trash } from "lucide-react";
import debounce from "lodash/debounce";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ColorPicker({ colors: initialColors }: { colors: IColor[] }) {
  const [colors, setColors] = useState<IColor[]>(initialColors);
  const [hex, setHex] = useState("#ffffff");
  const [colorName, setColorName] = useState("White");
  const [isLoading, setIsLoading] = useState(false);

  const fetchColorName = useCallback(
    debounce(async (newHex: string) => {
      const name = await getColorName(newHex);
      setColorName(name);
    }, 500),
    []
  );

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = event.target.value;
    setHex(newHex);
    fetchColorName(newHex);
  };

  const addColor = async () => {
    setIsLoading(true);
    try {
      // Insert new color into Supabase
      const { data, error } = await supabase
        .from("color")
        .insert([{ hex, name: colorName }])
        .select();

      if (error) {
        console.error("Error adding color:", error);
        return;
      }

      // Update local state with the new color
      if (data && data.length > 0) {
        setColors([...colors, data[0] as IColor]);
      }
      
      // Reset color input
      setHex("#ffffff");
      setColorName("White");
    } catch (error) {
      console.error("Failed to add color:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeColor = async (id: number) => {
    setIsLoading(true);
    try {
      // Delete color from Supabase
      const { error } = await supabase
        .from("color")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error removing color:", error);
        return;
      }

      // Update local state by filtering out the deleted color
      setColors(colors.filter(color => color.id !== id));
    } catch (error) {
      console.error("Failed to remove color:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShadowedBox>
      <Header2>Color Pallete</Header2>
      <div className="flex flex-wrap gap-4 items-center">
        {colors.map((color) => (
          <div
            key={color.id}
            className="flex flex-col items-center justify-center"
          >
            <div
              className="rounded-full p-4 border border-black"
              style={{ backgroundColor: `${color.hex}` }}
            ></div>
            <div className="bg-chestNut text-white flex items-center space-x-2 rounded-lg p-2.5 mt-2.5">
              <span className="text-xs">{color.name}</span>
              <button onClick={() => removeColor(color.id)} disabled={isLoading}>
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Divider margin="5px 0" />
      <div className="flex items-center justify-between space-x-2.5 py-2.5">
        <div className="flex items-center space-x-2.5">
          <input
            type="color"
            value={hex}
            onChange={handleColorChange}
          />
          <div className="flex flex-col">
            <p className="italic">{hex}</p>
            <p className="text-sm font-bold">{colorName || "Fetching..."}</p>
          </div>
        </div>
        <Button 
          onClick={addColor} 
          disabled={isLoading}
        >
          +
        </Button>
      </div>
    </ShadowedBox>
  );
}