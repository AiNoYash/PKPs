import { useRef } from "react"
import { View } from '@react-three/drei';

export function Viewport() {
    const viewRef = useRef(null);


    return (
        <div ref={viewRef} className='docker-content-container' style={{ position: 'relative' }}>
            <View track={viewRef}>

            </View>
        </div>
    )
}