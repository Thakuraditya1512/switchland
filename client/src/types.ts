export type Property={
 id:string;title:string;slug:string;description:string;property_type:string;listing_type:string;
 price:number;city:string;locality:string;bedrooms:number;bathrooms:number;area_sqft:number;
 cover_image:string;status:string;featured:boolean;is_featured?:boolean;
 plot_area_sqft?:number|null;price_per_sqft?:number|null;facing?:string|null;road_width_ft?:number|null;
 approval_status?:string|null;water_source?:string|null;groundwater_depth_ft?:number|null;
 water_availability_rating?:number|null;shopping_center_name?:string|null;shopping_center_distance_km?:number|null;
 vegetable_market_name?:string|null;vegetable_market_distance_km?:number|null;main_road_distance_km?:number|null;
 latitude?:number|null;longitude?:number|null;gallery_images?:string[];panorama_image?:string|null;
};
export type User={id:string;name:string;email:string;role:'customer'|'admin'};
export type Booking={id:string;property_id:string;property_title?:string;booking_type:'purchase_enquiry'|'site_visit';preferred_date:string|null;message:string|null;status:string;created_at:string};